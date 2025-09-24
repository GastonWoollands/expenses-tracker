import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from functools import lru_cache
from typing import Optional
from gspread import authorize
from oauth2client.service_account import ServiceAccountCredentials
from googleapiclient.discovery import build
from expenses_bot.config import GSHEETS_CREDENTIALS, GSHEETS_SHEET_NAME, GSHEETS_EMAIL, get_logger

#--------------------------------------------------------

logger = get_logger(__name__)

#--------------------------------------------------------

CREDENTIALS_PATH = GSHEETS_CREDENTIALS
SHEET_NAME = GSHEETS_SHEET_NAME
EMAIL = GSHEETS_EMAIL

#--------------------------------------------------------

def _get_creds():
    scope = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive',
    ]
    return ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_PATH, scope)

#--------------------------------------------------------

def _get_drive_service(creds):
    return build('drive', 'v3', credentials=creds)

#--------------------------------------------------------

def _get_or_create_folder(drive_service, folder_name: str) -> str:
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents"
    files = drive_service.files().list(q=query, fields="files(id)").execute().get('files', [])
    if files:
        return files[0]['id']
    folder = drive_service.files().create(
        body={'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'},
        fields='id'
    ).execute()
    drive_service.permissions().create(
        fileId=folder['id'],
        body={'type': 'user', 'role': 'writer', 'emailAddress': EMAIL},
        fields='id'
    ).execute()
    return folder['id']

#--------------------------------------------------------

def _find_spreadsheet(drive_service, sheet_name: str, folder_id: str) -> Optional[str]:
    query = (
        f"name = '{sheet_name}' and "
        f"mimeType = 'application/vnd.google-apps.spreadsheet' and "
        f"'{folder_id}' in parents"
    )
    files = drive_service.files().list(q=query, fields='files(id)').execute().get('files', [])
    return files[0]['id'] if files else None

#--------------------------------------------------------

def _get_or_create_sheet():
    creds = _get_creds()
    gs_client = authorize(creds)
    drive_service = _get_drive_service(creds)
    folder_id = _get_or_create_folder(drive_service, SHEET_NAME)
    sheet_id = _find_spreadsheet(drive_service, SHEET_NAME, folder_id)
    if sheet_id:
        return gs_client.open_by_key(sheet_id).sheet1
    spreadsheet = gs_client.create(SHEET_NAME)
    file_id = spreadsheet.id
    parents = drive_service.files().get(fileId=file_id, fields='parents').execute().get('parents', [])
    drive_service.files().update(
        fileId=file_id,
        addParents=folder_id,
        removeParents=','.join(parents),
        fields='id, parents'
    ).execute()
    return spreadsheet.sheet1

#--------------------------------------------------------

@lru_cache(maxsize=1)
def get_sheet():
    """Returns the Google Sheet worksheet, creating folder and file if needed."""
    try:
        return _get_or_create_sheet()
    except Exception as e:
        logger.error(f"Error initializing Google Sheets: {e}")
        raise

#--------------------------------------------------------

def add_expense(category: str, amount: float, dt: str, description: str):
    """Appends an expense row to the Google Sheet."""
    row = [dt, amount, category, description]
    get_sheet().append_row(row) 

#--------------------------------------------------------

def get_all_values():
    """Returns all sheet values (including header if present)."""
    return get_sheet().get_all_values()

#--------------------------------------------------------

def row_exists(dt: str, amount: float, category: str, description: str) -> bool:
    """Checks if an identical row already exists to keep appends idempotent."""
    values = get_all_values() or []
    target = [str(dt), str(amount), str(category), str(description)]
    for r in values:
        # Normalize to strings for comparison
        if [str(x) for x in r[:4]] == target:
            return True
    return False

#--------------------------------------------------------

def add_expense_if_missing(category: str, amount: float, dt: str, description: str) -> bool:
    """Appends only if the exact row does not exist. Returns True if appended."""
    if row_exists(dt, amount, category, description):
        logger.info(f"Row already exists: {dt} {amount} {category} {description}")
        return False
    add_expense(category, amount, dt, description)
    logger.info(f"Row added: {dt} {amount} {category} {description}")
    return True