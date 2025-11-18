# Base de Datos - Expense Tracker

Este directorio contiene los scripts SQL para inicializar y gestionar la base de datos PostgreSQL en Neon.

## Estructura

- `schema.sql` - Script principal que crea todas las tablas, índices y constraints necesarios
- `init_db.py` - Script Python para inicializar la base de datos fácilmente
- `check_db.py` - Script Python para verificar el estado de la base de datos

## Instalación en Neon PostgreSQL

### Opción 1: Usando la consola web de Neon

1. Accede a tu proyecto en [Neon Console](https://console.neon.tech)
2. Ve a la sección "SQL Editor"
3. Copia y pega el contenido de `schema.sql`
4. Ejecuta el script

### Opción 2: Usando psql desde la terminal

```bash
# Obtén la connection string de Neon (formato: postgresql://user:password@host/database)
# Luego ejecuta:
psql "postgresql://user:password@host/database" -f database/schema.sql
```

### Opción 3: Usando el script Python incluido (Recomendado)

```bash
# Desde el directorio raíz del proyecto
python database/init_db.py

# O con poetry:
poetry run python database/init_db.py
```

Este script:
- Lee automáticamente el `schema.sql`
- Se conecta usando `DATABASE_URL` de tu `.env`
- Ejecuta todas las creaciones de tablas e índices
- Muestra mensajes claros de éxito o error

### Verificar el estado de la base de datos

```bash
python database/check_db.py
# O con poetry:
poetry run python database/check_db.py
```

Este script muestra:
- Tablas existentes y cantidad de registros
- Índices creados
- Constraints configurados
- Información de la base de datos

## Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# PostgreSQL / Neon Configuration
DATABASE_URL=postgresql://user:password@host/database
# O si usas SSL:
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Estructura de Tablas

### 1. `users`
Almacena los usuarios identificados por Firebase UID.

### 2. `accounts`
Cuentas financieras de cada usuario (efectivo, bancos, tarjetas de crédito, etc.)

### 3. `categories`
Categorías de ingresos y gastos. Pueden ser globales (`user_id = NULL`) o específicas por usuario.

### 4. `transactions`
Transacciones financieras: gastos, ingresos y transferencias entre cuentas.

### 5. `budgets`
Presupuestos por categoría y período (diario, semanal, mensual, anual).

## Notas

- Todas las tablas usan UUIDs como identificadores primarios
- Se implementan constraints para mantener la integridad de datos
- Los índices están optimizados para consultas frecuentes por usuario y fecha
- Las relaciones usan `ON DELETE CASCADE` para mantener la consistencia

