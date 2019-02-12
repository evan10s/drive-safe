var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');

/* GET home page. */
router.get('/', async function(req, res, next) {
  console.log(req.user);
  if (!req.user) {
    return res.redirect('/login');
  }
  let trips = await fetch('https://api.automatic.com/trip/', {
    headers: {
      Authorization: `bearer ${req.user.accessToken}`
    }
  });
  console.log("Trip JSON:");
  let json = await trips.json();
  console.log(json);
  res.render('index', { request: req, trips: json.results });
});

module.exports = router;
