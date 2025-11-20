# Quick Railway Deployment

## Fast Setup (5 minutes)

### 1. Connect Repository
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `expenses-tracker` repository
4. Select your branch (e.g., `experiment-ui`)

### 2. Configure Service
In Railway dashboard:
- **Settings** → **Root Directory**: Set to `backend_py`
- **Settings** → **Start Command**: `python run.py`

### 3. Add PostgreSQL Database
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Copy the `DATABASE_URL` from the database service
3. Add it to your service's environment variables

### 4. Add Environment Variables
Go to **Variables** tab and add:

**Required:**
```bash
DATABASE_URL=<from PostgreSQL service>
FIREBASE_CREDENTIALS_GUITA='<your Firebase JSON>'
HOST=0.0.0.0
RELOAD=false
```

**Optional (for WhatsApp):**
```bash
WHATSAPP_VERIFY_TOKEN=<your_token>
WHATSAPP_ACCESS_TOKEN=<your_token>
WHATSAPP_PHONE_NUMBER_ID=<your_id>
API_TOKEN=<your_token>
GEMINI_API_KEY=<your_key>
```

### 5. Deploy
Railway will auto-deploy. Check **Logs** tab for status.

### 6. Get URL
**Settings** → **Networking** → **Generate Domain**

Your API: `https://your-app.railway.app`

## Test Deployment

```bash
# Health check
curl https://your-app.railway.app/health

# Should return: {"status":"healthy","service":"expenses-tracker-api"}
```

## Troubleshooting

**Build fails?**
- Check `requirements.txt` exists in `backend_py/`
- Verify Root Directory is set to `backend_py`

**App crashes?**
- Check logs in Railway dashboard
- Verify `DATABASE_URL` is correct
- Ensure Firebase credentials are valid JSON

**Database connection?**
- Make sure `DATABASE_URL` includes `?sslmode=require`
- Verify database service is running

