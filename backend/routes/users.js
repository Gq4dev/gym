const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await db('users').select('id', 'username', 'role', 'created_at');
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { username, password, role = 'user' } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username y password requeridos' });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'rol invalido' });
  }
  try {
    const existing = await db('users').where({ username }).first();
    if (existing) return res.status(409).json({ message: 'username en uso' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db('users').insert({ username, password: hash, role }).returning('id');
    const newId = result[0]?.id || result[0]; // handles differences between PG and SQLite returning formats
    res.status(201).json({ id: newId, username, role });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  }
  try {
    const deleted = await db('users').where({ id }).del();
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

module.exports = router;
