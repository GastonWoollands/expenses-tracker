#!/usr/bin/env python3
"""
Script para verificar la conexión y el estado de la base de datos.

Muestra información sobre las tablas existentes y su estructura.

Uso:
    python database/check_db.py
    # O con poetry:
    poetry run python database/check_db.py
"""
import asyncio
import asyncpg
import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path para importar config
sys.path.insert(0, str(Path(__file__).parent.parent))

from expenses_bot.config import DATABASE_URL, get_logger

logger = get_logger(__name__)


async def check_database():
    """Verifica la conexión y muestra información de la base de datos"""
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL no está configurado. Por favor, configúralo en tu archivo .env")
        sys.exit(1)
    
    logger.info("Conectando a la base de datos...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("✅ Conexión exitosa\n")
        
        # Verificar tablas existentes
        tables_query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """
        tables = await conn.fetch(tables_query)
        
        expected_tables = ['users', 'accounts', 'categories', 'transactions', 'budgets']
        existing_tables = [row['table_name'] for row in tables]
        
        logger.info("📊 Tablas en la base de datos:")
        for table in expected_tables:
            if table in existing_tables:
                # Contar registros
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                logger.info(f"  ✅ {table}: {count} registros")
            else:
                logger.info(f"  ❌ {table}: NO EXISTE")
        
        # Verificar índices
        indexes_query = """
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
            ORDER BY indexname
        """
        indexes = await conn.fetch(indexes_query)
        
        logger.info(f"\n📇 Índices creados: {len(indexes)}")
        for idx in indexes[:10]:  # Mostrar primeros 10
            logger.info(f"  - {idx['indexname']}")
        if len(indexes) > 10:
            logger.info(f"  ... y {len(indexes) - 10} más")
        
        # Verificar constraints
        constraints_query = """
            SELECT conname, contype
            FROM pg_constraint
            WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND contype IN ('p', 'f', 'c', 'u')
            ORDER BY conname
        """
        constraints = await conn.fetch(constraints_query)
        
        logger.info(f"\n🔒 Constraints: {len(constraints)}")
        constraint_types = {'p': 'PRIMARY KEY', 'f': 'FOREIGN KEY', 'c': 'CHECK', 'u': 'UNIQUE'}
        for constraint in constraints[:10]:  # Mostrar primeros 10
            ctype = constraint_types.get(constraint['contype'], constraint['contype'])
            logger.info(f"  - {constraint['conname']} ({ctype})")
        if len(constraints) > 10:
            logger.info(f"  ... y {len(constraints) - 10} más")
        
        # Información de la base de datos
        db_info = await conn.fetchrow("SELECT version(), current_database(), current_user")
        logger.info(f"\n💾 Información de la base de datos:")
        logger.info(f"  Database: {db_info['current_database']}")
        logger.info(f"  User: {db_info['current_user']}")
        logger.info(f"  PostgreSQL: {db_info['version'].split(',')[0]}")
        
        await conn.close()
        logger.info("\n✅ Verificación completada")
        
    except asyncpg.exceptions.InvalidPasswordError:
        logger.error("❌ Error de autenticación. Verifica tu DATABASE_URL")
        sys.exit(1)
    except asyncpg.exceptions.InvalidCatalogNameError:
        logger.error("❌ La base de datos especificada no existe. Créala primero en Neon")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error al verificar la base de datos: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(check_database())

