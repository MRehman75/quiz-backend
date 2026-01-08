const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { getDb } = require('../../db');

const router = express.Router();

router.post('/quizzes/:quizId/attempts', 
  param('quizId').isMongoId(), 
  body('answers').isArray({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const quizId = new ObjectId(req.params.quizId);
  const questions = await db.collection('questions').find({ quizId }).sort({ _id: 1 }).toArray();
  if (!questions.length) return res.status(400).json({ message: 'No questions' });
  const answers = req.body.answers;
  let score = 0;
  for (let i = 0; i < Math.min(answers.length, questions.length); i++) {
    if (answers[i] === questions[i].answerIndex) score++;
  }
    const percentage = Math.round((score / questions.length) * 100);
    const result = { 
      quizId, 
      email: req.body.email || 'anonymous',
      total: questions.length, 
      correct: score,
      percentage: percentage,
      createdAt: new Date() 
    };
  await db.collection('attempts').insertOne(result);
    res.status(201).json({ total: questions.length, correct: score, percentage: percentage });
  }
);

// Get quiz analytics
router.get('/quizzes/:quizId/analytics', param('quizId').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const quizId = new ObjectId(req.params.quizId);
  
  const attempts = await db.collection('attempts').find({ quizId }).sort({ createdAt: -1 }).toArray();
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
    : 0;
  const uniqueEmails = [...new Set(attempts.map(a => a.email).filter(e => e && e !== 'anonymous'))].length;
  
  res.json({
    totalAttempts,
    uniqueParticipants: uniqueEmails,
    averageScore: avgScore,
    attempts: attempts.map(a => ({
      email: a.email,
      score: a.correct,
      total: a.total,
      percentage: a.percentage,
      createdAt: a.createdAt
    }))
  });
});

module.exports = router;
