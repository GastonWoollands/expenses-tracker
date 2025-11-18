#!/usr/bin/env python3
"""
Script para inicializar la base de datos PostgreSQL en Neon.

Ejecuta el schema.sql para crear todas las tablas necesarias.

Uso:
    python database/init_db.py
    # O con poetry:
    poetry run python database/init_db.py
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


async def init_database():
    """Inicializa la base de datos ejecutando el schema.sql"""
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL no está configurado. Por favor, configúralo en tu archivo .env")
        sys.exit(1)
    
    # Leer el archivo schema.sql
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        logger.error(f"No se encontró el archivo schema.sql en {schema_path}")
        sys.exit(1)
    
    schema_sql = schema_path.read_text(encoding="utf-8")
    
    logger.info("Conectando a la base de datos...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("Conexión exitosa. Ejecutando schema.sql...")
        
        # Ejecutar el script SQL
        await conn.execute(schema_sql)
        
        logger.info("✅ Base de datos inicializada correctamente")
        logger.info("Todas las tablas, índices y constraints han sido creados")
        
        await conn.close()
        
    except asyncpg.exceptions.InvalidPasswordError:
        logger.error("❌ Error de autenticación. Verifica tu DATABASE_URL")
        sys.exit(1)
    except asyncpg.exceptions.InvalidCatalogNameError:
        logger.error("❌ La base de datos especificada no existe. Créala primero en Neon")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error al inicializar la base de datos: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(init_database())

