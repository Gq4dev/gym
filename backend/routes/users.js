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

// Helper function to attach exercises (reused logic from routines.js)
async function attachExercises(routines) {
  if (!routines.length) return routines;
  const ids = routines.map(r => r.id);
  const rows = await db('routine_exercises').whereIn('routine_id', ids);
  const map = {};
  for (const r of routines) map[r.id] = { ...r, exercises: [] };
  for (const row of rows) map[row.routine_id].exercises.push(row);
  return Object.values(map);
}

// GET /api/users/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.params.id }).select('id', 'username', 'created_at').first();
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Fetch assignments for this user
    const assignments = await db('assignments')
      .where({ user_id: user.id })
      .orderBy('assigned_at', 'desc');

    if (assignments.length === 0) {
      return res.json({ user, assigned_routines: [] });
    }

    const routineIds = assignments.map(a => a.routine_id);
    const routines = await db('routines').whereIn('id', routineIds);
    const routinesWithExercises = await attachExercises(routines);

    // Merge routines into assignments
    const assigned_routines = assignments.map(a => {
      const routine = routinesWithExercises.find(r => r.id === a.routine_id);
      return {
        ...a,
        routine: routine || null
      };
    });

    res.json({ user, assigned_routines });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ message: 'Error al cargar panel del usuario' });
  }
});

// POST /api/users/:id/routines
router.post('/:id/routines', async (req, res) => {
  const { title, notes, exercises = [] } = req.body; // exercises: [{ exercise_id, sets, reps, duration }]

  if (!title) return res.status(400).json({ message: 'titulo requerido' });

  // Use a transaction to ensure all inserts succeed together
  try {
    const result = await db.transaction(async trx => {
      // 1. Create Routine (Personalized -> is_generic: false)
      const routineResult = await trx('routines').insert({
        title,
        notes: notes || null,
        is_generic: false
      }).returning('id');
      const routineId = routineResult[0]?.id || routineResult[0];

      // 2. Attach Exercises
      if (exercises && exercises.length > 0) {
        const exerciseInserts = exercises.map(ex => ({
          routine_id: routineId,
          exercise_id: ex.exercise_id,
          sets: ex.sets || null,
          reps: ex.reps || null,
          duration: ex.duration || null
        }));
        await trx('routine_exercises').insert(exerciseInserts);
      }

      // 3. Assign to User
      const assignmentResult = await trx('assignments').insert({
        routine_id: routineId,
        user_id: req.params.id,
        due_date: req.body.due_date || null
      }).returning('id');

      const assignmentId = assignmentResult[0]?.id || assignmentResult[0];

      return { assignmentId, routineId };
    });

    res.status(201).json({ message: 'Rutina creada y asignada exitosamente', data: result });
  } catch (err) {
    console.error('Error creating user routine:', err);
    res.status(500).json({ message: 'Error interno al crear rutina y asignacion' });
  }
});

module.exports = router;
