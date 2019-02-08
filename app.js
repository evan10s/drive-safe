const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressNunjucks = require('express-nunjucks');
const session = require('express-session');
const index = require('./routes/index');
const users = require('./routes/users');
const auth = require('./routes/auth');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoose = require('mongoose');
const User = require('./schema');
const webpack = require("webpack");
const webpackMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./webpack.config");


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const isDev = app.get('env') === 'development';

const njk = expressNunjucks(app, {
  watch: isDev,
  noCache: isDev
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));



app.use(webpackMiddleware(webpack(webpackConfig)))
// requires the model with Passport-Local Mongoose plugged in

mongoose.connect('mongodb://localhost:27017/drive-safe', {useNewUrlParser: true});

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());



// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get('/login',
    function(req, res) {
      res.render('login');
    }
);

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
      console.log("success")
      res.redirect('/');
    });

app.get('/logout',
    function(req, res){
      req.logout();
      res.redirect('/');
    });


//app.use('/auth', auth);
app.use('/users', users);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
