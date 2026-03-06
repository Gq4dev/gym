const express = require('express');
const db = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await db('categories').select('*').orderBy('name');
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Error al obtener categorias' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'nombre requerido' });
  try {
    const existing = await db('categories').where({ name }).first();
    if (existing) return res.status(409).json({ message: 'Categoria ya existe' });

    const result = await db('categories').insert({ name }).returning('id');
    const newId = result[0]?.id || result[0];
    res.status(201).json({ id: newId, name });
  } catch (err) {
    console.error('Error al crear categoria:', err);
    res.status(500).json({ message: 'Error al crear categoria' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'nombre requerido' });
  try {
    const updated = await db('categories').where({ id: req.params.id }).update({ name });
    if (!updated) return res.status(404).json({ message: 'Categoria no encontrada' });
    res.json({ id: Number(req.params.id), name });
  } catch {
    res.status(500).json({ message: 'Error al actualizar categoria' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('categories').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ message: 'Categoria no encontrada' });
    res.json({ message: 'Categoria eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar categoria' });
  }
});

module.exports = router;
