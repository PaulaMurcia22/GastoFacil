# Guía de Desarrollo - Gasto Fácil MVP

## Estructura del Proyecto

```
gasto-facil/
├── backend-api/      → API NestJS + PostgreSQL
├── frontend-expo/    → App React Native (Expo)
└── database/         → Scripts SQL
```

## Comandos para Ejecutar el Proyecto

### ✅ Backend (NestJS)

```bash
cd backend-api
npm install
npm run start:dev
```

- **URL**: `http://localhost:3000`
- **Documentación API**: `http://localhost:3000/api`
- **Health check**: `GET http://localhost:3000/health`

### ✅ Frontend (React Native - Expo)

```bash
cd frontend-expo
npm install
npm start
```

Luego presiona:
- `i` para iOS simulator
- `a` para Android emulator
- `w` para web

### 📋 Base de Datos

Se requiere PostgreSQL. Ejecuta los scripts en orden:

```bash
cd database

# 1. Crear base de datos
psql -U postgres -f 00_create_database.sql

# 2. Crear esquema y tablas
psql -U postgres -d gasto_facil -f 01_schema.sql

# 3. Crear stored procedures
psql -U postgres -d gasto_facil -f 05_user_login_sp.sql

# 4. Pruebas
psql -U postgres -d gasto_facil -f 03_smoke_test.sql
```

## Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/gasto_facil
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Seguridad

✅ **SQL Injection**: Protegido con:
  - Stored Procedures (SP) con parámetros
  - Queries parametrizadas ($1, $2, etc.)
  - NestJS ORM validación

✅ **Passwords**: Encriptadas con `bcryptjs`

✅ **JWT**: Tokens de sesión seguros

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend Mobile | React Native + Expo |
| Backend | NestJS |
| Base de Datos | PostgreSQL |
| Autenticación | JWT + bcrypt |

## Troubleshooting

### Error "Cannot find module"
```bash
npm install
npm run build
```

### Puerto 3000 en uso
```bash
# Cambiar puerto en backend
PORT=3001 npm run start:dev
```

### Expo no detecta cambios
```bash
# Reiniciar Expo
npm start -- --clear
```

## Notas

- ❌ No uses scripts `.ps1` (están obsoletos)
- ✅ Los comandos `npm` funcionan directamente en terminal (PowerShell/CMD/Bash)
- ✅ Asegúrate que Node.js 20.19.0+ esté instalado
- ✅ PostgreSQL debe estar corriendo antes de iniciar el backend
