# Database scripts

## Orden de ejecucion en pgAdmin 4

1. Abrir una nueva Query Tool conectada a la base `postgres`.
2. Ejecutar `00_create_database.sql`.
3. Conectarse a la nueva base `gasto_facil`.
4. Ejecutar `01_schema.sql`.
5. Ejecutar `02_user_insert_sp.sql`.
6. Ejecutar `03_smoke_test.sql`.
7. Ejecutar `04_login_lookup.sql` solo cuando necesites validar manualmente un usuario para login.

## Estructura incluida

- `users`: usuarios registrados del MVP.
- `sp_create_user`: procedimiento almacenado para insertar usuarios.
- `04_login_lookup.sql`: consulta utilitaria para revisar el `password_hash` y el estado del usuario por correo.

## Notas

- El indice unico se aplica sobre `LOWER(email)` para evitar duplicados por mayusculas/minusculas.
- `status` usa `1` para activo y `0` para inactivo.
- El campo `audit` vive dentro de la tabla y guarda el detalle de auditoria en formato JSON.
- El script de smoke test inserta datos temporales y al final hace `ROLLBACK`.
