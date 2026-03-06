const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/my-routines
// Devuelve las rutinas asignadas al usuario autenticado, con sus ejercicios
router.get('/', async (req, res) => {
  try {
    const assignments = await db('assignments')
      .where({ user_id: req.user.id })
      .orderBy('assigned_at', 'desc');

    if (!assignments.length) return res.json([]);

    const routineIds = assignments.map(a => a.routine_id);

    const [routines, routineExercises] = await Promise.all([
      db('routines').whereIn('id', routineIds),
      db('routine_exercises')
        .whereIn('routine_id', routineIds)
        .join('exercises', 'routine_exercises.exercise_id', 'exercises.id')
        .leftJoin('categories', 'exercises.category_id', 'categories.id')
        .select(
          'routine_exercises.id',
          'routine_exercises.routine_id',
          'routine_exercises.exercise_id',
          'routine_exercises.sets',
          'routine_exercises.reps',
          'routine_exercises.duration',
          'exercises.name as exercise_name',
          'exercises.video_url',
          'categories.name as category_name'
        ),
    ]);

    const routineMap = {};
    for (const r of routines) routineMap[r.id] = r;

    const exercisesByRoutine = {};
    for (const re of routineExercises) {
      if (!exercisesByRoutine[re.routine_id]) exercisesByRoutine[re.routine_id] = [];
      exercisesByRoutine[re.routine_id].push(re);
    }

    const result = assignments.map(a => ({
      id: a.id,
      routine_id: a.routine_id,
      routine_title: routineMap[a.routine_id]?.title || '',
      routine_notes: routineMap[a.routine_id]?.notes || null,
      assigned_at: a.assigned_at,
      due_date: a.due_date,
      exercises: exercisesByRoutine[a.routine_id] || [],
    }));

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error al obtener rutinas' });
  }
});

module.exports = router;
