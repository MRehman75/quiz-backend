const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../db');

const router = express.Router();

router.post('/register',
  body('name').isString().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;
    const db = getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = { name, email, password: hash, createdAt: new Date() };
    const result = await db.collection('users').insertOne(user);
    const token = jwt.sign({ sub: result.insertedId.toString(), email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token });
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user._id.toString(), email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  }
);

module.exports = router;
