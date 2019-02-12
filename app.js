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
const AutomaticStrategy = require("passport-automatic");
const mongoose = require('mongoose');

const User = require('./schema');
const webpack = require("webpack");
const webpackMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./webpack.config");
require('dotenv').config();


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: process.env.SESSIONS_SECRET_KEY, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());


// use static serialize and deserialize of model for passport session support
// serialize and deserialize functions from https://github.com/HackGT/registration/blob/2e11c01cfb373dc9db6cdccad4c8454ad4488724/server/routes/auth.ts
// which is licensed under the MIT License as of 2/12/2019 (https://github.com/HackGT/registration/blob/9d6c0ee93acf2e7b9771790196871cf231aa2e60/LICENSE)
passport.serializeUser((user, done) => {
    done(null, user._id.toString());
});
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

const isDev = process.env.prod !== 'true';

const njk = expressNunjucks(app, {
    watch: isDev,
    noCache: isDev
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));


app.use(webpackMiddleware(webpack(webpackConfig)));
// requires the model with Passport-Local Mongoose plugged in

mongoose.connect(encodeURI(`mongodb://${process.env.DB_CONNECTION_STRING}`), {
    useNewUrlParser: true,
    useCreateIndex: true
})
    .catch(error => console.error("Failed to connect to mongodb, error:", error));

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

passport.use(new AutomaticStrategy({
        clientID: process.env.AUTOMATIC_CLIENT_ID,
        clientSecret: process.env.AUTOMATIC_CLIENT_SECRET,
        scope: ['scope:user:profile', 'scope:trip', 'scope:location', 'scope:vehicle:profile', 'scope:vehicle:events', 'scope:behavior']
    },
    async function (accessToken, refreshToken, profile, done) {
        console.log("we did the thing alright!");
        console.log(profile);

        let user = await User.findOne({automaticId: profile.id});

        if (!user) {
            user = new User({
                automaticId: profile.id,
                firstName: profile.first_name,
                lastName: profile.last_name,
                email: profile.email,
                username: profile.username,
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        } else {
            user.automaticId = profile.id;
            user.firstName = profile.first_name;
            user.lastName = profile.last_name;
            user.email = profile.email;
            user.username = profile.username;
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
        }
        await user.save();
        return done(null, user);
    }
));


app.get('/login',
    function (req, res) {
        console.log(req.user);
        res.render('login');
    }
);

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}),
    function (req, res, next) {
        console.log("success");
        res.redirect('/');
    });

app.get('/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/auth/automatic',
    passport.authenticate('automatic'));

app.get('/auth/automatic/callback',
    passport.authenticate('automatic', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

//app.use('/auth', auth);
app.use('/users', users);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
