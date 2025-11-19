# Database Schema Migration

Este directorio contiene los scripts para validar y migrar el schema de la base de datos a la versión compatible con Firebase.

## Schema Correcto para Firebase

El schema correcto usa:
- `users.id` como **TEXT** (Firebase UID, no UUID)
- Todas las tablas relacionadas usan `user_id TEXT` que referencia `users(id)`

### Estructura de Tablas

```
users
  - id: TEXT PRIMARY KEY (Firebase UID)
  - email: TEXT NOT NULL UNIQUE
  - created_at: TIMESTAMP

accounts
  - id: UUID PRIMARY KEY
  - user_id: TEXT REFERENCES users(id)
  - name: TEXT
  - type: TEXT
  - currency: TEXT
  - created_at: TIMESTAMP

categories
  - id: UUID PRIMARY KEY
  - user_id: TEXT REFERENCES users(id) (NULL = global)
  - name: TEXT
  - type: TEXT
  - icon: TEXT
  - created_at: TIMESTAMP

transactions
  - id: UUID PRIMARY KEY
  - user_id: TEXT REFERENCES users(id)
  - account_id: UUID REFERENCES accounts(id)
  - category_id: UUID REFERENCES categories(id)
  - type: TEXT
  - amount: NUMERIC
  - currency: TEXT
  - description: TEXT
  - occurred_at: TIMESTAMP
  - created_at: TIMESTAMP

budgets
  - id: UUID PRIMARY KEY
  - user_id: TEXT REFERENCES users(id)
  - category_id: UUID REFERENCES categories(id)
  - amount: NUMERIC
  - period: TEXT
  - created_at: TIMESTAMP
```

## Scripts Disponibles

### 1. `migrate_schema.py` (Script Python - Recomendado)

**Propósito**: Script Python automatizado para validar y migrar el schema.

**Uso**:
```bash
# Validar solo (sin hacer cambios)
python database/migrate_schema.py --validate-only

# Migrar el schema (con confirmación)
python database/migrate_schema.py

# Migrar sin confirmación (útil para scripts automatizados)
python database/migrate_schema.py --force
```

**Características**:
- ✅ Valida el schema antes y después de la migración
- ✅ Muestra información detallada con colores
- ✅ Solicita confirmación antes de hacer cambios (a menos que uses `--force`)
- ✅ Carga automáticamente variables de entorno desde `backend_py/.env`
- ✅ Muestra un resumen del schema después de la migración

**Requisitos**:
- Python 3.8+
- `asyncpg` instalado (ya está en `requirements.txt`)
- `python-dotenv` instalado (ya está en `requirements.txt`)
- Variable de entorno `DATABASE_URL` configurada

### 2. `schema.sql` (Schema de Referencia)

Este es el schema de referencia que debe usarse. Contiene la definición completa de todas las tablas con `CREATE TABLE IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces.

**Uso**:
```bash
# Ejecutar directamente con psql
psql $DATABASE_URL -f database/schema.sql
```

**Nota**: Este script usa `CREATE TABLE IF NOT EXISTS`, por lo que no eliminará tablas existentes. Si necesitas migrar desde un schema incorrecto, usa `migrate_schema.py` en su lugar.

### 3. `validate_and_migrate_schema.sql` (Usado por migrate_schema.py)

Este script SQL es usado internamente por `migrate_schema.py`. No está diseñado para ejecutarse directamente, pero puede usarse manualmente si es necesario.

**⚠️ ADVERTENCIA**: Este script **ELIMINA todas las tablas** y las recrea con el schema correcto.

## Pasos Recomendados

### Si estás empezando desde cero:

1. **Migrar al schema correcto**:
   ```bash
   python database/migrate_schema.py
   ```

2. **O usar el schema.sql directamente** (si no hay tablas existentes):
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```

### Si ya tienes tablas con schema incorrecto:

1. **Validar el schema actual**:
   ```bash
   python database/migrate_schema.py --validate-only
   ```

2. **Migrar al schema correcto** (eliminará y recreará todas las tablas):
   ```bash
   python database/migrate_schema.py
   ```

3. **Verificar que todo esté correcto**:
   ```bash
   python database/migrate_schema.py --validate-only
   ```

### Si ya tienes datos importantes:

1. **Hacer backup**:
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Exportar los datos** antes de migrar

3. **Migrar el schema**:
   ```bash
   python database/migrate_schema.py
   ```

4. **Importar los datos** con las transformaciones necesarias (convertir UUIDs a TEXT para Firebase UIDs)

## Verificación Manual

Puedes verificar manualmente el schema ejecutando:

```sql
-- Verificar users.id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';
-- Debe ser: data_type = 'text'

-- Verificar user_id en todas las tablas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'user_id' 
AND table_schema = 'public'
ORDER BY table_name;
-- Todos deben ser: data_type = 'text'
```

## Notas Importantes

- El Firebase UID es un string de 28 caracteres, no un UUID estándar
- Todas las referencias a `users.id` deben usar `TEXT`, no `UUID`
- El schema en `database/schema.sql` es la fuente de verdad
- El código del backend (`backend_py/auth/firebase_auth.py`) asume que `users.id` es `TEXT`
- El script `migrate_schema.py` es la forma recomendada de migrar el schema

## Troubleshooting

### Error: "invalid UUID 'GSQbFHa0Pvgf2xwLDIS7xJSlaWu2'"

Este error indica que la tabla `users` tiene `id` como `UUID` en lugar de `TEXT`. Ejecuta `migrate_schema.py` para corregirlo:

```bash
python database/migrate_schema.py
```

### Error: "column 'firebase_uid' does not exist"

Este error indica que estás usando el schema antiguo. El schema correcto usa `users.id` directamente como Firebase UID (TEXT), no una columna separada `firebase_uid`.

### Error: "DATABASE_URL no está configurado"

Asegúrate de tener la variable de entorno `DATABASE_URL` configurada. El script intenta cargarla desde `backend_py/.env` automáticamente.
