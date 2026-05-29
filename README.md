# GastoFácil


## Resumen del problema (problema central)
Falta de planificación y control efectivo de metas financieras personales. Las personas reciben ingresos periódicos pero no distribuyen correctamente sus ingresos considerando gastos fijos, gastos variables, fechas de ingreso y metas a corto y largo plazo. Esto provoca priorización de gastos impulsivos y postergación de objetivos financieros importantes.

## Proceso de ideación
- Identificación del problema: usuarios sin herramientas móviles sencillas para planear y priorizar ahorro frente a gastos.
- Propuesta: aplicación móvil que permita registrar ingresos periódicos, gastos (fijos y variables), definir metas financieras y visualizar el avance, con recordatorios relacionados a fechas de ingreso.
- Decisiones: priorizar desarrollo móvil (Expo/React Native) y una API modular en NestJS para facilitar evolución y pruebas.

## Levantamiento de requerimientos

### Requerimientos funcionales (identificados)
- RF1: Registrar usuarios y autenticarlos (registro, login, logout).
- RF2: Registrar ingresos periódicos y listarlos por usuario.
- RF3: Registrar gastos fijos y variables; CRUD de gastos.
- RF4: Crear metas financieras con fecha y valor objetivo.
- RF5: Registrar aportes/contribuciones a metas y mostrar estado de avance.
- RF6: Relacionar metas con el flujo de ingresos y calcular capacidad de ahorro disponible.
- RF7: Generar recordatorios asociados a fechas de ingreso.
- RF8: Funcionalidades administrativas para gestionar cuentas de usuario y revisar funcionamiento.

### Requerimientos no funcionales
- RNF1 — Usabilidad: interfaz accesible para usuarios sin conocimientos financieros.
- RNF2 — Disponibilidad: servicio disponible cuando el usuario lo necesite (mínima ventana de mantenimiento).
- RNF3 — Rendimiento: cálculos coherentes en tiempo real (latencia baja en endpoints críticos).
- RNF4 — Escalabilidad: soportar múltiples usuarios concurrentes.
- RNF5 — Confiabilidad y seguridad: persistencia segura y protección de datos (sesiones con cookies seguras / JWT, control de sesiones).



## Aplicación de UML
Se utilizó UML para modelar los casos de uso, las entidades principales y secuencias críticas del sistema. Los diagramas se encuentran en la carpeta `diagramas/`:

- Diagrama de casos de uso (interacciones entre actores y funcionalidades principales).
- Diagrama de clases (entidades principales y relaciones).
- Diagramas de secuencia (flujos: login, crear gasto, cálculo de capacidad de ahorro).


## Actores encontrados
Actores principales identificados:
- Actores directos:
  - Usuario final (estudiante, trabajador, padre, independiente).
  - Administrador del sistema.
- Actores técnicos:
  - Equipo de desarrollo.
- Actores indirectos:
  - Instituciones educativas.
  - Entidades financieras.
  - Personas dependientes económicamente del usuario.



## Funcionalidades implementadas (estado actual)
Se implementaron las siguientes funcionalidades:
- Autenticación: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` (manejo de cookie de sesión).
- Gastos: CRUD completo bajo `api/v1/expenses` (listado, obtener por id, crear, actualizar, eliminar) y `GET /api/v1/expenses/categories`.
- Ingresos: CRUD completo bajo `api/v1/incomes` y `GET /api/v1/incomes/categories`.
- Metas: CRUD de metas y manejo de contribuciones en `api/v1/goals` (crear meta, añadir/actualizar aportes, eliminar, listar, categorías).
- Autorización por sesión: `SessionGuard` protege endpoints para que cada usuario opere sobre sus propios registros.
- Persistencia: scripts SQL en la carpeta `database/` para creación de esquema y procedimientos básicos.
- Panel administrativo completo.

Funcionalidades parcialmente implementadas o pendientes:
- Recordatorios y notificaciones en tiempo real.
- Cálculo automático y visualización de la "capacidad de ahorro" vinculada a ingresos y gastos.

## Tecnologías utilizadas
- Backend: NestJS, TypeScript
- Base de datos: PostgreSQL
- Frontend móvil: React Native / Expo
- Autenticación: JWT + cookies de sesión

## Resumen general del desarrollo
Se implementó una API RESTful modular en NestJS con servicios, repositorios y controladores para gestionar usuarios, ingresos, gastos y metas. El frontend móvil está estructurado en Expo.

## Mejoras y trabajo pendiente 

## Instalación y ejecución
Requisitos previos:
- Node.js >= 20 y npm >= 10
- PostgreSQL (cliente `psql` accesible)

1) Configurar la base de datos

Ejecuta los scripts SQL incluidos en la carpeta `database/`:

```powershell
# Desde la raíz del proyecto
psql -U postgres -f database/00_create_database.sql
psql -U postgres -d gasto_facil -f database/01_schema.sql
psql -U postgres -d gasto_facil -f database/04_created_tables.sql
psql -U postgres -d gasto_facil -f database/02_user_insert_sp.sql
psql -U postgres -d gasto_facil -f database/03_user_login_sp.sql
```

2) Backend (API NestJS)

```powershell
# Ir al backend
cd backend-api
# Instalar dependencias
npm install
# Ejecutar
npm run start:dev
```

3) Frontend (Expo)

```powershell
cd frontend-expo
# Instalar dependencias
npm install
# Inicia el servidor de Expo 
npm run start
# Para abrir directamente en Android/iOS:
npm run android
npm run ios
```
