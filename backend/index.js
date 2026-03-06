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

// Endpoint para correr el seed en producción (protegido por SEED_SECRET)
app.post('/api/admin/run-seed', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const seedFn = require('./config/seeds/workout_data');
    await seedFn.seed(db);
    res.json({ ok: true, message: 'Seed ejecutado correctamente' });
  } catch (err) {
    console.error('Seed error:', err);
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
