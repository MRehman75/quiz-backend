const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { getDb } = require('../../db');
const auth = require('../../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const db = getDb();
  // Get quizzes created by the logged-in user
  const quizzes = await db.collection('quizzes')
    .find({ ownerId: new ObjectId(req.user.id) }, { 
      projection: { title: 1, description: 1, createdAt: 1, ownerId: 1 } 
    })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ items: quizzes });
});

router.post('/', auth,
  body('title').isString().isLength({ min: 3 }),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const db = getDb();
    const doc = {
      title: req.body.title,
      description: req.body.description || '',
      ownerId: new ObjectId(req.user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('quizzes').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString() });
  }
);

router.get('/:id', param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const quiz = await db.collection('quizzes').findOne({ _id: new ObjectId(req.params.id) });
  if (!quiz) return res.status(404).json({ message: 'Not found' });
  res.json(quiz);
});

router.put('/:id', auth, param('id').isMongoId(), body('title').optional().isString(), body('description').optional().isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const update = { $set: { updatedAt: new Date() } };
  if (req.body.title) update.$set.title = req.body.title;
  if (req.body.description) update.$set.description = req.body.description;
  const result = await db.collection('quizzes').updateOne({ _id: new ObjectId(req.params.id) }, update);
  if (!result.matchedCount) return res.status(404).json({ message: 'Not found' });
  res.json({ updated: true });
});

router.delete('/:id', auth, param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const result = await db.collection('quizzes').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) return res.status(404).json({ message: 'Not found' });
  await db.collection('questions').deleteMany({ quizId: new ObjectId(req.params.id) });
  res.status(204).send();
});

module.exports = router;
