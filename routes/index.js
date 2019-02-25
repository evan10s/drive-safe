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

    console.log("Hard brakes average: ", sum(hard_brakes) / hard_brakes.length);
    console.log("Highway percentage average: ", sum(highway_fractions) / highway_fractions.length);
    let total_distance = (sum(distances) / distances.length * 0.000621371).toFixed(2);
    let extrapolation = 100 / total_distance;
    let highway_avg = (sum(highway_fractions) / highway_fractions.length).toFixed(2);
    let hard_brakes_avg = (sum(hard_brakes) / hard_brakes.length * extrapolation).toFixed(2);
    let hard_accels_avg = (sum(hard_accels) / hard_accels.length * extrapolation).toFixed(2);

    let total_duration = (sum(durations) / durations.length / 60).toFixed(2);
    let night_avg = (sum(night_fractions) / night_fractions.length).toFixed(2);
    let scoreable = [highway_avg, hard_brakes_avg, hard_accels_avg, night_avg];

    let weights = [25, 5, 5, 50];
    let deductions = scoreable.map((value, index, array) => value*weights[index]);

    console.log(deductions);
    let score = 100 - sum(deductions);
    let letterGrade = "F";
    //let letterGrade = "https://i.imgur.com/bp9ahda.png";
    if(score > 60) letterGrade = "D";
     if(score > 70) letterGrade = "C";
     if(score > 80) letterGrade = "B";
     if(score > 90) letterGrade = "A";
    res.render('index', {
        request: req,
        highway_avg: highway_avg,
        hard_brakes_avg: hard_brakes_avg,
        hard_accels_avg: hard_accels_avg,
        total_distance: total_distance,
        total_duration: total_duration,
        night_avg: night_avg,
        deductions: deductions,
        score: score.toFixed(2)
        ,letterGrade: letterGrade
    });
});

module.exports = router;
