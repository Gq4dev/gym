const express = require('express');
const db = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /api/exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await db('exercises').select('*').orderBy('name');
    res.json(exercises);
  } catch {
    res.status(500).json({ message: 'Error al obtener ejercicios' });
  }
});

// POST /api/exercises
router.post('/', async (req, res) => {
  const { name, description, category_id, video_url } = req.body;
  if (!name) return res.status(400).json({ message: 'nombre requerido' });
  try {
    const [id] = await db('exercises').insert({
      name,
      description: description || null,
      category_id: category_id || null,
      video_url: video_url || null,
    });
    res.status(201).json({ id, name, description, category_id, video_url });
  } catch {
    res.status(500).json({ message: 'Error al crear ejercicio' });
  }
});

// PUT /api/exercises/:id
router.put('/:id', async (req, res) => {
  const { name, description, category_id, video_url } = req.body;
  if (!name) return res.status(400).json({ message: 'nombre requerido' });
  try {
    const updated = await db('exercises').where({ id: req.params.id }).update({
      name,
      description: description || null,
      category_id: category_id || null,
      video_url: video_url || null,
    });
    if (!updated) return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.json({ id: Number(req.params.id), name, description, category_id, video_url });
  } catch {
    res.status(500).json({ message: 'Error al actualizar ejercicio' });
  }
});

// DELETE /api/exercises/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('exercises').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.json({ message: 'Ejercicio eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar ejercicio' });
  }
});

module.exports = router;
