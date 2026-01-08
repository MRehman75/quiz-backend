var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

/* ===============================
   VIEW ENGINE SETUP
================================ */
app.set('views', path.join(__dirname, 'views'));
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
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   HOME ROUTE (FIXES 404)
================================ */
app.get('/', (req, res) => {
  res.send('Quiz Backend API is running 🚀');
});

/* ===============================
   ROUTES
================================ */
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/quizzes', require('./routes/api/quizzes'));
app.use('/api', require('./routes/api/questions'));
app.use('/api', require('./routes/api/attempts'));

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

  // API errors return JSON
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.status(status).json({
      message: err.message || 'Internal Server Error'
    });
  }

  // Non-API errors render page
  res.status(status);
  res.render('error');
});

/* ===============================
   EXPORT FOR VERCEL
================================ */
module.exports = app;
