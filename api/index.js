const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

/* ===============================
   DATABASE CONNECT
================================ */
require('../db');   // 👈 FIXED PATH

/* ===============================
   VIEW ENGINE SETUP
================================ */
app.set('views', path.join(__dirname, '../views')); // 👈 FIXED
app.set('view engine', 'ejs');

/* ===============================
   MIDDLEWARE
================================ */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../public'))); // 👈 FIXED

/* ===============================
   HOME ROUTE (TEST)
================================ */
app.get('/', (req, res) => {
  res.json({ status: 'Quiz Backend API running 🚀' });
});

/* ===============================
   ROUTES (FIXED PATHS)
================================ */
app.use('/', require('../routes/index'));
app.use('/users', require('../routes/users'));
app.use('/api/auth', require('../routes/api/auth'));
app.use('/api/quizzes', require('../routes/api/quizzes'));
app.use('/api', require('../routes/api/questions'));
app.use('/api', require('../routes/api/attempts'));

/* ===============================
   404 HANDLER
================================ */
app.use(function (req, res, next) {
  next(createError(404));
});

/* ===============================
   ERROR HANDLER
================================ */
app.use(function (err, req, res, next) {
  const status = err.status || 500;

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({
      error: err.message || 'Internal Server Error'
    });
  }

  res.status(status).json({ error: err.message });
});

/* ===============================
   EXPORT (NO LISTEN!)
================================ */
module.exports = app;
