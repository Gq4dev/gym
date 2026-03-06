const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  try {
    const existing = await db('users').where({ username }).first();
    if (existing) return res.status(409).json({ message: 'username taken' });

    const hash = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({ username, password: hash });
    res.status(201).json({ id, username });
  } catch (err) {
    res.status(500).json({ message: 'error registering user' });
  }
});

// login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  try {
    const user = await db('users').where({ username }).first();
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'error logging in' });
  }
});

module.exports = router;
