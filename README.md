# GYM App

Proyecto de aplicación multiusuario para gestión de rutinas de ejercicios.

## Estructura

- `backend/` - Node.js + Express API
- `frontend/` - React aplicación

## Backend

```bash
cd backend
npm install
npm run migrate   # use knex to create tables (npm run migrate could be custom script)
npm run seed      # insert admin usuario
node index.js     # inicia servidor en puerto 3001
```

## Frontend

```bash
cd frontend
npm install
npm start         # inicia React en puerto 3000
```

> El backend expone endpoints en `http://localhost:3001/api/...`.

## Notas

- El usuario admin inicial está `admin` / `adminpass`.
- Ajustar `JWT_SECRET` en `.env` en el backend.
