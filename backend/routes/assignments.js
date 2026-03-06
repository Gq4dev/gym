const express = require('express');
const db = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /api/assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await db('assignments').select('*').orderBy('assigned_at', 'desc');
    res.json(assignments);
  } catch {
    res.status(500).json({ message: 'Error al obtener asignaciones' });
  }
});

// POST /api/assignments
router.post('/', async (req, res) => {
  const { routine_id, user_id, due_date } = req.body;
  if (!routine_id || !user_id) {
    return res.status(400).json({ message: 'routine_id y user_id requeridos' });
  }
  try {
    const routine = await db('routines').where({ id: routine_id }).first();
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' });

    const user = await db('users').where({ id: user_id }).first();
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const [id] = await db('assignments').insert({
      routine_id,
      user_id,
      due_date: due_date || null,
    });
    res.status(201).json({ id, routine_id, user_id, due_date });
  } catch {
    res.status(500).json({ message: 'Error al crear asignacion' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('assignments').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ message: 'Asignacion no encontrada' });
    res.json({ message: 'Asignacion eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar asignacion' });
  }
});

module.exports = router;
