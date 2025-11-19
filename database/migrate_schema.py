#!/usr/bin/env python3
"""
Script de migración del schema de la base de datos para Neon PostgreSQL
Migra el schema a la versión compatible con Firebase (users.id como TEXT)

Uso:
    python database/migrate_schema.py [--validate-only] [--force]

Opciones:
    --validate-only: Solo valida el schema sin hacer cambios
    --force: Ejecuta la migración sin confirmación (útil para scripts automatizados)
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path
from typing import Optional, Dict, List, Tuple
import argparse

# Colores para output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_header(msg: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")


async def get_db_connection() -> asyncpg.Connection:
    """Obtener conexión a la base de datos"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print_error("DATABASE_URL no está configurado en las variables de entorno")
        print_info("Asegúrate de tener DATABASE_URL configurado o exportado")
        sys.exit(1)
    
    try:
        conn = await asyncpg.connect(database_url)
        return conn
    except Exception as e:
        print_error(f"No se pudo conectar a la base de datos: {e}")
        sys.exit(1)


async def validate_schema(conn: asyncpg.Connection) -> Tuple[bool, List[str]]:
    """Validar el schema actual"""
    print_header("Validando Schema Actual")
    
    issues = []
    all_correct = True
    
    # Verificar si las tablas existen
    tables = ['users', 'accounts', 'categories', 'transactions', 'budgets']
    existing_tables = await conn.fetch("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY($1)
    """, tables)
    
    existing_table_names = {row['table_name'] for row in existing_tables}
    
    for table in tables:
        if table in existing_table_names:
            print_success(f"Tabla '{table}' existe")
        else:
            print_warning(f"Tabla '{table}' no existe")
            issues.append(f"Tabla '{table}' no existe")
    
    # Verificar users.id
    if 'users' in existing_table_names:
        users_id_type = await conn.fetchval("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'users' 
            AND column_name = 'id'
        """)
        
        if users_id_type == 'text':
            print_success(f"users.id es TEXT (correcto para Firebase UID)")
        else:
            print_error(f"users.id es {users_id_type} (debe ser TEXT)")
            issues.append(f"users.id es {users_id_type}, debe ser TEXT")
            all_correct = False
    
    # Verificar user_id en todas las tablas relacionadas
    user_id_tables = ['accounts', 'categories', 'transactions', 'budgets']
    for table in user_id_tables:
        if table in existing_table_names:
            user_id_type = await conn.fetchval("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = $1 
                AND column_name = 'user_id'
            """, table)
            
            if user_id_type == 'text':
                print_success(f"{table}.user_id es TEXT (correcto)")
            else:
                print_error(f"{table}.user_id es {user_id_type} (debe ser TEXT)")
                issues.append(f"{table}.user_id es {user_id_type}, debe ser TEXT")
                all_correct = False
    
    if all_correct and len(issues) == 0:
        print_success("Schema validado: La base de datos está lista para usar Firebase UID")
    else:
        print_warning(f"Se encontraron {len(issues)} problema(s) en el schema")
        for issue in issues:
            print_warning(f"  - {issue}")
    
    return all_correct, issues


async def execute_migration(conn: asyncpg.Connection) -> bool:
    """Ejecutar la migración completa del schema"""
    print_header("Ejecutando Migración del Schema")
    
    # Leer el script SQL
    script_path = Path(__file__).parent / "validate_and_migrate_schema.sql"
    if not script_path.exists():
        print_error(f"No se encontró el script SQL: {script_path}")
        return False
    
    try:
        sql_content = script_path.read_text()
        print_info(f"Leyendo script SQL: {script_path}")
        
        # Dividir el SQL en statements individuales
        # Remover comentarios y dividir por punto y coma
        statements = []
        current_statement = []
        in_comment = False
        in_string = False
        string_char = None
        
        for line in sql_content.split('\n'):
            # Procesar línea por línea
            i = 0
            while i < len(line):
                char = line[i]
                
                # Manejar strings
                if char in ("'", '"') and (i == 0 or line[i-1] != '\\'):
                    if not in_string:
                        in_string = True
                        string_char = char
                    elif char == string_char:
                        in_string = False
                        string_char = None
                
                # Manejar comentarios (solo si no estamos en un string)
                elif not in_string:
                    if char == '-' and i + 1 < len(line) and line[i+1] == '-':
                        # Comentario de línea, ignorar el resto
                        break
                    elif char == '/' and i + 1 < len(line) and line[i+1] == '*':
                        in_comment = True
                        i += 1
                    elif char == '*' and i + 1 < len(line) and line[i+1] == '/' and in_comment:
                        in_comment = False
                        i += 1
                
                if not in_comment:
                    current_statement.append(char)
                
                i += 1
            
            current_statement.append('\n')
        
        # Unir y dividir por punto y coma
        full_sql = ''.join(current_statement)
        # Dividir por punto y coma, pero mantener DO $$ bloques juntos
        parts = []
        current_part = []
        in_do_block = False
        do_block_depth = 0
        
        for char in full_sql:
            current_part.append(char)
            
            if not in_do_block and char == 'D' and len(current_part) >= 2 and ''.join(current_part[-2:]) == 'DO':
                # Verificar que sea realmente "DO"
                if len(current_part) == 2 or (len(current_part) > 2 and not current_part[-3].isalnum()):
                    in_do_block = True
                    do_block_depth = 0
            elif in_do_block:
                if char == '$' and len(current_part) >= 2 and current_part[-2] == '$':
                    do_block_depth += 1
                elif char == ';' and do_block_depth == 0:
                    in_do_block = False
                    parts.append(''.join(current_part).strip())
                    current_part = []
            elif char == ';':
                stmt = ''.join(current_part).strip()
                if stmt:
                    parts.append(stmt)
                current_part = []
        
        if current_part:
            stmt = ''.join(current_part).strip()
            if stmt:
                parts.append(stmt)
        
        # Filtrar statements vacíos y ejecutar
        statements = [stmt for stmt in parts if stmt and not stmt.startswith('--')]
        
        print_info(f"Ejecutando {len(statements)} statement(s) SQL...")
        
        # Ejecutar cada statement
        for i, statement in enumerate(statements, 1):
            try:
                # Saltar el último SELECT que es solo para mostrar resultados
                if statement.strip().upper().startswith('SELECT') and 'information_schema' in statement:
                    continue
                
                await conn.execute(statement)
                if i % 5 == 0:  # Mostrar progreso cada 5 statements
                    print_info(f"  Procesados {i}/{len(statements)} statements...")
            except Exception as e:
                # Algunos errores son esperados (como DROP TABLE IF EXISTS cuando no existe)
                if "does not exist" not in str(e).lower():
                    print_warning(f"  Advertencia en statement {i}: {str(e)[:100]}")
        
        print_success("Migración ejecutada correctamente")
        return True
        
    except Exception as e:
        print_error(f"Error al ejecutar la migración: {e}")
        import traceback
        print_error(traceback.format_exc())
        return False


async def show_schema_summary(conn: asyncpg.Connection):
    """Mostrar resumen del schema después de la migración"""
    print_header("Resumen del Schema")
    
    summary = await conn.fetch("""
        SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.character_maximum_length
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND t.table_name IN ('users', 'accounts', 'categories', 'transactions', 'budgets')
        AND (c.column_name = 'id' AND t.table_name = 'users' OR c.column_name = 'user_id')
        ORDER BY t.table_name, c.column_name
    """)
    
    if summary:
        print(f"{'Tabla':<15} {'Columna':<15} {'Tipo':<15} {'Estado'}")
        print("-" * 60)
        for row in summary:
            table = row['table_name']
            column = row['column_name']
            data_type = row['data_type']
            status = "✅ Correcto" if data_type == 'text' else "❌ Incorrecto"
            print(f"{table:<15} {column:<15} {data_type:<15} {status}")
    else:
        print_warning("No se encontraron columnas para mostrar")


async def main():
    parser = argparse.ArgumentParser(
        description="Migrar schema de base de datos a versión compatible con Firebase"
    )
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Solo validar el schema sin hacer cambios'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Ejecutar migración sin confirmación'
    )
    
    args = parser.parse_args()
    
    print_header("Script de Migración de Schema - Neon PostgreSQL")
    print_info("Este script migrará el schema para usar Firebase UID (TEXT)")
    
    # Cargar variables de entorno desde .env si existe
    try:
        from dotenv import load_dotenv
        env_path = Path(__file__).parent.parent / "backend_py" / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            print_info(f"Variables de entorno cargadas desde: {env_path}")
    except ImportError:
        print_warning("python-dotenv no está instalado, usando variables de entorno del sistema")
    
    conn = await get_db_connection()
    
    try:
        if args.validate_only:
            # Solo validar
            is_correct, issues = await validate_schema(conn)
            if is_correct:
                print_success("\n✅ El schema está correcto, no se necesitan cambios")
                return 0
            else:
                print_error(f"\n❌ El schema tiene {len(issues)} problema(s)")
                print_info("Ejecuta sin --validate-only para corregir el schema")
                return 1
        else:
            # Validar primero
            is_correct, issues = await validate_schema(conn)
            
            if is_correct:
                print_success("\n✅ El schema ya está correcto, no se necesitan cambios")
                return 0
            
            # Mostrar advertencia
            print_warning("\n⚠️  ADVERTENCIA: Esta operación eliminará todas las tablas existentes")
            print_warning("⚠️  y las recreará con el schema correcto para Firebase")
            
            if not args.force:
                response = input("\n¿Continuar con la migración? (s/N): ").strip().lower()
                if response not in ['s', 'si', 'sí', 'y', 'yes']:
                    print_info("Migración cancelada por el usuario")
                    return 0
            
            # Ejecutar migración
            success = await execute_migration(conn)
            
            if success:
                # Validar después de la migración
                print()
                is_correct, _ = await validate_schema(conn)
                if is_correct:
                    await show_schema_summary(conn)
                    print_success("\n✅ Migración completada exitosamente")
                    return 0
                else:
                    print_error("\n❌ La migración se ejecutó pero el schema aún tiene problemas")
                    return 1
            else:
                print_error("\n❌ La migración falló")
                return 1
                
    finally:
        await conn.close()


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print_error("\n\nMigración cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print_error(f"\nError inesperado: {e}")
        import traceback
        print_error(traceback.format_exc())
        sys.exit(1)

