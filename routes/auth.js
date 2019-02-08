var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/login', function(req, res, next) {
  console.log(('hi'))
  res.render('login', { request: req });
});

router.post('/login', function(req, res, next) {
  console.log("login now!!")
  try {
    passport.authenticate('local', {failureRedirect: '/auth/login'}, function (req, res) {
      res.redirect('/');
    });
  } catch(e) {
    throw new Error("passport auth failed")
  }
});

module.exports = router;
