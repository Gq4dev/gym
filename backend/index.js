require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/my-routines', require('./routes/myRoutines'));
app.use('/api/history', require('./routes/history'));

// Middleware de autenticación por SEED_SECRET
function checkSecret(req, res, next) {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// Endpoint para correr el seed de rutinas/ejercicios
app.post('/api/admin/run-seed', checkSecret, async (req, res) => {
  try {
    const seedFn = require('./config/seeds/workout_data');
    await seedFn.seed(db);
    res.json({ ok: true, message: 'Seed ejecutado correctamente' });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para crear usuario admin (si no existe)
app.post('/api/admin/create-admin', checkSecret, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { username = 'admin', password = 'adminpass' } = req.body;
    const existing = await db('users').where({ username }).first();
    if (existing) {
      // Actualiza la contraseña y el rol
      const hash = await bcrypt.hash(password, 10);
      await db('users').where({ username }).update({ password: hash, role: 'admin' });
      return res.json({ ok: true, message: `Usuario '${username}' actualizado como admin` });
    }
    const hash = await bcrypt.hash(password, 10);
    await db('users').insert({ username, password: hash, role: 'admin' });
    res.json({ ok: true, message: `Usuario admin '${username}' creado` });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

// Auto-migrar al arrancar y luego levantar el servidor
db.migrate.latest()
  .then(() => {
    console.log('Migraciones aplicadas');
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error en migraciones:', err);
    process.exit(1);
  });
