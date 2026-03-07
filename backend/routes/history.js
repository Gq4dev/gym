const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/history - Get user's workout history
router.get('/', async (req, res) => {
    try {
        const history = await db('workout_history')
            .where({ user_id: req.user.id })
            .orderBy('completed_at', 'desc');

        // Parse the JSON string snapshot back into an object
        const formattedHistory = history.map(item => ({
            ...item,
            routine_snapshot: JSON.parse(item.routine_snapshot)
        }));

        res.json(formattedHistory);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
});

// POST /api/history - Save a completed workout
router.post('/', async (req, res) => {
    const { routine_id, exercise_data } = req.body;
    if (!routine_id || !exercise_data) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    try {
        const stringifiedSnapshot = typeof exercise_data === 'string'
            ? exercise_data
            : JSON.stringify(exercise_data);

        const result = await db('workout_history').insert({
            user_id: req.user.id,
            routine_id,
            routine_snapshot: stringifiedSnapshot
        }).returning('id');

        const newId = result[0]?.id || result[0];
        res.status(201).json({ id: newId, message: 'Historial guardado exitosamente' });
    } catch (err) {
        console.error('Error saving history:', err);
        res.status(500).json({ message: 'Error al guardar en el historial' });
    }
});

module.exports = router;
