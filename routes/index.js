var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');

function sum(l) {
    let sum = 0;
    for (let i = 0; i < l.length; i++) {
        sum += l[i];
    }
    return sum;
}

/* GET home page. */
router.get('/', async function (req, res, next) {
    console.log(req.user);
    if (!req.user) {
        return res.redirect('/login');
    }
    let hard_brakes = [];
    let hard_accels = [];
    let highway_fractions = [];
    let distances = [];
    let durations = [];
    let night_fractions = [];
    let page = 1;
    let lastPage = false;
    while (!lastPage) {
        let trips = await fetch(`https://api.automatic.com/trip/?limit=20&page=${page}`, {
            headers: {
                Authorization: `bearer ${req.user.accessToken}`
            }
        });
        let json = await trips.json();
        console.log(page);
        if (json.results.length < 20) {
            lastPage = true;
        }
        for (let j = 0; j < json.results.length; j++) {
            hard_brakes.push(json.results[j].hard_brakes);
            hard_accels.push(json.results[j].hard_accels);
            highway_fractions.push(json.results[j].highway_fraction);
            night_fractions.push(json.results[j].night_driving_fraction);
            distances.push(json.results[j].distance_m);
            durations.push(json.results[j].duration_s);
        }
        page++;
    }

    let total_distance = sum(distances) / 1609.344;
    let extrapolation = 100 / total_distance;
    let highway_avg = (sum(highway_fractions) / highway_fractions.length);
    let hard_brakes_avg = (sum(hard_brakes) * extrapolation);
    let hard_accels_avg = (sum(hard_accels) * extrapolation);

    let total_duration = (sum(durations) / durations.length / 60);
    let night_avg = (sum(night_fractions) / night_fractions.length);
    let scoreable = [highway_avg, hard_brakes_avg, hard_accels_avg, night_avg];

    let weights = [25, 5, 5, 50];
    let deductions = scoreable.map((value, index, array) => (value*weights[index]));

    let score = 100 - sum(deductions);
    deductions = deductions.map( v => v.toFixed(2));
    let letterGrade = "https://i.imgur.com/GWJ2a2Y.png"; //F
     if(score > 60 && score <= 70) letterGrade = "https://i.imgur.com/Smz9Wbg.png"; //D
     if(score > 70 && score <= 80) letterGrade = "https://i.imgur.com/X66lskd.png"; //C
     if(score > 80 && score <= 90) letterGrade = "https://i.imgur.com/OwjbEgo.png"; //B
     if(score > 90) letterGrade = "https://i.imgur.com/IexnhBR.png"; //A

    res.render('index', {
        request: req,
        highway_avg: (highway_avg * 100).toFixed(2),
        hard_brakes_avg: hard_brakes_avg.toFixed(2),
        hard_accels_avg: hard_accels_avg.toFixed(2),
        total_distance: total_distance.toFixed(2),
        total_duration: total_duration.toFixed(2),
        night_avg: (night_avg * 100).toFixed(2),
        deductions: deductions,
        score: score.toFixed(2),
        num_trips: distances.length,
        letterGrade: letterGrade
    });
});

module.exports = router;
