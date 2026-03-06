const express = require('express');
const db = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

async function attachExercises(routines) {
  if (!routines.length) return routines;
  const ids = routines.map(r => r.id);
  const rows = await db('routine_exercises').whereIn('routine_id', ids);
  const map = {};
  for (const r of routines) map[r.id] = { ...r, exercises: [] };
  for (const row of rows) map[row.routine_id].exercises.push(row);
  return Object.values(map);
}

// GET /api/routines
router.get('/', async (req, res) => {
  try {
    const routines = await db('routines').select('*').orderBy('title');
    res.json(await attachExercises(routines));
  } catch {
    res.status(500).json({ message: 'Error al obtener rutinas' });
  }
});

// POST /api/routines
router.post('/', async (req, res) => {
  const { title, notes } = req.body;
  if (!title) return res.status(400).json({ message: 'titulo requerido' });
  try {
    const result = await db('routines').insert({ title, notes: notes || null }).returning('id');
    const newId = result[0]?.id || result[0];
    res.status(201).json({ id: newId, title, notes, exercises: [] });
  } catch (err) {
    console.error('Error al crear rutina:', err);
    res.status(500).json({ message: 'Error al crear rutina' });
  }
});

// PUT /api/routines/:id
router.put('/:id', async (req, res) => {
  const { title, notes } = req.body;
  if (!title) return res.status(400).json({ message: 'titulo requerido' });
  try {
    const updated = await db('routines').where({ id: req.params.id }).update({ title, notes: notes || null });
    if (!updated) return res.status(404).json({ message: 'Rutina no encontrada' });
    res.json({ id: Number(req.params.id), title, notes });
  } catch {
    res.status(500).json({ message: 'Error al actualizar rutina' });
  }
});

// DELETE /api/routines/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('routines').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ message: 'Rutina no encontrada' });
    res.json({ message: 'Rutina eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar rutina' });
  }
});

// POST /api/routines/:id/exercises
router.post('/:id/exercises', async (req, res) => {
  const { exercise_id, sets, reps, duration } = req.body;
  if (!exercise_id) return res.status(400).json({ message: 'exercise_id requerido' });
  try {
    const routine = await db('routines').where({ id: req.params.id }).first();
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' });

    const result = await db('routine_exercises').insert({
      routine_id: req.params.id,
      exercise_id,
      sets: sets || null,
      reps: reps || null,
      duration: duration || null,
    }).returning('id');
    const newId = result[0]?.id || result[0];
    res.status(201).json({ id: newId, routine_id: Number(req.params.id), exercise_id, sets, reps, duration });
  } catch (err) {
    console.error('Error al agregar ejercicio:', err);
    res.status(500).json({ message: 'Error al agregar ejercicio' });
  }
});

// DELETE /api/routines/:id/exercises/:reId
router.delete('/:id/exercises/:reId', async (req, res) => {
  try {
    const deleted = await db('routine_exercises')
      .where({ id: req.params.reId, routine_id: req.params.id })
      .del();
    if (!deleted) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Ejercicio quitado de rutina' });
  } catch {
    res.status(500).json({ message: 'Error al quitar ejercicio' });
  }
});

module.exports = router;
