# Database scripts

## Orden de ejecucion sugerido en pgAdmin 4

1. Abrir una nueva Query Tool conectada a la base `postgres`.
2. Ejecutar `00_create_database.sql`.
3. Conectarse a la nueva base `gasto_facil`.
4. Ejecutar `01_schema.sql`.
5. Ejecutar `02_user_insert_sp.sql`.
6. Ejecutar `03_user_login_sp.sql`.
7. Ejecutar `04_created_tables.sql` para tablas de ingresos, gastos y metas.

