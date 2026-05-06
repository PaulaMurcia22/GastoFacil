# Gasto Facil MVP

Base inicial del proyecto en formato monorepo para arrancar el MVP con:

- `frontend-expo`: app movil en Expo + React Native.
- `backend-api`: API en NestJS + TypeScript.
- `database`: scripts SQL para PostgreSQL listos para ejecutar desde pgAdmin 4.
- `docs`: notas de implementacion y referencia al mockup actual.

## Contexto

La referencia visual usada para esta primera entrega esta en la carpeta existente del workspace:

- `components/mockup/screens/register-screen.tsx`

El foco de esta iteracion es el modulo de registro.

## Estructura

```text
gasto-facil/
  frontend-expo/
  backend-api/
  database/
  docs/
```

## Orden sugerido para arrancar

1. Crear la base de datos desde `database/00_create_database.sql`.
2. Ejecutar `database/01_schema.sql` conectado a la base `gasto_facil`.
3. Ejecutar `database/02_user_insert_sp.sql`.
4. Revisar `database/03_smoke_test.sql` para validar que la estructura quedo bien.
5. Activar `Node 20.19.0` solo para este proyecto:
   `nvm use 20.19.0`
6. Instalar dependencias del front y del back:
   `npm run install:all`
7. Configurar los `.env` usando los ejemplos incluidos en `frontend-expo` y `backend-api`.
8. Levantar el backend:
   `npm run dev:back`
9. Levantar el frontend:
   `npm run dev:front`

## Node por proyecto

Este repo queda fijado a `Node 20.19.0` con:

- `.nvmrc`
- `.node-version`
- `engines` en `package.json`

Tu otro proyecto puede seguir usando `Node 14.21.3`. Solo necesitas cambiar de version cuando entres o salgas de este repo:

- Para este MVP: `nvm use 20.19.0`
- Para tu proyecto antiguo: `nvm use 14.21.3`

## Verlo en el computador

Sin usar celular, la opcion mas simple es abrir el frontend como web en el navegador.

1. Activar `Node 20.19.0`:
   `nvm use 20.19.0`
2. Levantar backend:
   `cd backend-api`
   `npm install`
   `npm run start:dev`
3. En otra terminal, levantar frontend web:
   `cd frontend-expo`
   `npm install`
   `npm run web`
4. Abrir la URL local que muestre Expo, normalmente `http://localhost:8081`.

Para verlo en navegador no necesitas cambiar `frontend-expo/.env`; `localhost` funciona bien desde el mismo PC.

## Alcance del MVP actual

- Registro de usuario con nombre completo, correo, clave, edad y nombre preferido.
- Registro de usuario con nombre completo, correo, clave, edad y nickname.
- Validacion basica en frontend y backend.
- Persistencia en PostgreSQL.
- Auditoria embebida en la tabla `users`.
- Endpoint de salud para verificar la API.

## Siguiente paso natural

Despues de esta base, lo mas directo es continuar con:

1. Inicio de sesion.
2. Recuperacion de contrasena.
3. Onboarding posterior al registro.
