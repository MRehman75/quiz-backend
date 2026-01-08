var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(helmet());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/quizzes', require('./routes/api/quizzes'));
app.use('/api', require('./routes/api/questions'));
app.use('/api', require('./routes/api/attempts'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  const status = err.status || 500;
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    res.status(status).json({ message: err.message });
    return;
  }
  res.status(status);
  res.render('error');
});

module.exports = app;
