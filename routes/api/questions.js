const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { getDb } = require('../../db');
const auth = require('../../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/quizzes/:quizId/questions', param('quizId').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const items = await db.collection('questions').find({ quizId: new ObjectId(req.params.quizId) }).toArray();
  res.json({ items });
});

router.post('/quizzes/:quizId/questions', auth, param('quizId').isMongoId(),
  body('text').isString().isLength({ min: 3 }),
  body('options').isArray({ min: 2 }),
  body('answerIndex').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const db = getDb();
    const { text, options, answerIndex } = req.body;
    if (answerIndex >= options.length) return res.status(400).json({ message: 'answerIndex out of range' });
    const doc = { quizId: new ObjectId(req.params.quizId), text, options, answerIndex, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('questions').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString() });
  }
);

router.put('/questions/:id', auth, param('id').isMongoId(), body('text').optional().isString(), body('options').optional().isArray({ min: 2 }), body('answerIndex').optional().isInt({ min: 0 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const update = { $set: { updatedAt: new Date() } };
  if (req.body.text) update.$set.text = req.body.text;
  if (req.body.options) update.$set.options = req.body.options;
  if (typeof req.body.answerIndex === 'number') update.$set.answerIndex = req.body.answerIndex;
  const result = await db.collection('questions').updateOne({ _id: new ObjectId(req.params.id) }, update);
  if (!result.matchedCount) return res.status(404).json({ message: 'Not found' });
  res.json({ updated: true });
});

router.delete('/questions/:id', auth, param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const result = await db.collection('questions').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

module.exports = router;
