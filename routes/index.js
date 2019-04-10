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

// Rounds all numeric properties of an object to the specified number of decimal places (n)
// Does not work beyond the first level
function numToFixed(obj, n) {
    console.log(obj);
    for (let k in obj) {
        if (obj.hasOwnProperty(k) && typeof obj[k] === "number") {
            obj[k] = obj[k].toFixed(n);
        }
    }
    return obj;
}

function sumProps(obj) {
    let sum = 0;
    for (let k in obj) {
        if (obj.hasOwnProperty(k) && typeof obj[k] === "number") {
            sum += obj[k];
        }
    }

    return sum;
}

function bound(value, a, b) {
    return Math.max(Math.min(b, value), a);
}

function setScore(obj, isDay) {
    const HARD_BRAKES_WEIGHT_DAY = (x) => x * Math.pow(2, x / 30);
    const HARD_BRAKES_WEIGHT_NIGHT = (x) => x * Math.pow(2, x / 20);

    const HARD_ACCELS_WEIGHT_DAY = (x) => .4348 * x * Math.pow(2, x / 30);
    const HARD_ACCELS_WEIGHT_NIGHT = (x) => .2433 * x * Math.pow(2, x / 10);
    const DIST_WEIGHT_EXP = (x) => Math.pow(2.5, x / 1000) - 1;
    if (isDay) {
        obj.deductions.hard_brakes = HARD_BRAKES_WEIGHT_DAY(obj.hard_brakes_avg);
        obj.deductions.hard_accels = HARD_ACCELS_WEIGHT_DAY(obj.hard_accels_avg);
    } else {
        obj.deductions.hard_brakes = HARD_BRAKES_WEIGHT_NIGHT(obj.hard_brakes_avg);
        obj.deductions.hard_accels = HARD_ACCELS_WEIGHT_NIGHT(obj.hard_accels_avg);
    }

    obj.deductions.distance = DIST_WEIGHT_EXP(obj.distance);
    obj.score = bound(100 - sumProps(obj.deductions), 0, 100);
}

/* GET home page. */
router.get('/', async function (req, res, next) {
    console.log(req.user);
    if (!req.user) {
        return res.redirect('/login');
    }

    let data = {
        day: {
            hard_brakes: {
                sum: 0,
                count: 0
            },
            hard_accels: {
                sum: 0,
                count: 0
            },
        },
        night: {
            hard_brakes: {
                sum: 0,
                count: 0
            },
            hard_accels: {
                sum: 0,
                count: 0
            }
        },
        distance: {
            day: 0,
            night: 0
        },
        calculated: {
            day: {
                hard_brakes_avg: 0,
                hard_accels_avg: 0,
                distance: 0,
                deductions: {
                    hard_brakes: 0,
                    hard_accels: 0,
                    distance: 0
                },
                score: 0
            },
            night: {
                hard_brakes_avg: 0,
                hard_accels_avg: 0,
                distance: 0,
                deductions: {
                    hard_brakes: 0,
                    hard_accels: 0,
                    distance: 0
                },
                score: 0
            },
            score: 0
        }
    };

    let distances = [];
    let durations = [];
    let page = 1;
    let lastPage = false;
    const NIGHT_BEGIN = 18;
    const NIGHT_END = 7;
    const now = new Date();
    const oneMonthAgo = new Date().setMonth(now.getMonth() - 1);
    let numTrips = 0;
    while (!lastPage) {
        let trips = await fetch(`https://api.automatic.com/trip/?limit=20&page=${page}`, {
            headers: {
                Authorization: `bearer ${req.user.accessToken}`
            }
        });
        let json = await trips.json();

        if (json.results.length < 20) {
            lastPage = true;
        }

        for (let j = 0; j < json.results.length; j++) {
            const startDate = new Date(json.results[j].started_at);
            const startHour = startDate.getHours();
            if (startDate >= oneMonthAgo && (startHour >= NIGHT_BEGIN || startHour <= NIGHT_END)) {
                data.night.hard_brakes.sum += json.results[j].hard_brakes;
                data.night.hard_accels.sum += json.results[j].hard_accels;
                data.distance.night += json.results[j].distance_m;
                distances.push(json.results[j].distance_m);
                durations.push(json.results[j].duration_s);
                numTrips++;
            } else if (startDate >= oneMonthAgo) {
                data.day.hard_brakes.sum += json.results[j].hard_brakes;
                data.day.hard_accels.sum += json.results[j].hard_accels;
                data.distance.day += json.results[j].distance_m;
                distances.push(json.results[j].distance_m);
                durations.push(json.results[j].duration_s);
                numTrips++;
            } else {
                lastPage = true;
                break;
            }

        }
        page++;
    }
    let total_distance = sum(distances) / 1609.344;
    const total_dist_day = data.distance.day / 1609.344;
    const total_dist_night = data.distance.night / 1609.344;
    let extrapolation = 100 / total_distance;
    let extrapolation_day = 100 / total_dist_day;
    let extrapolation_night = 100 / total_dist_night;
    data.calculated.day = {
        distance: total_dist_day,
        hard_brakes_avg: data.day.hard_brakes.sum * extrapolation_day,
        hard_accels_avg: data.day.hard_accels.sum * extrapolation_day,
        percent: (total_dist_day / (total_dist_day + total_dist_night)),
        percent_100: (100 * total_dist_day / (total_dist_day + total_dist_night)),
        deductions: {
            hard_brakes: 0,
            hard_accels: 0,
            distance: 0
        },
        score: 0
    };
    data.calculated.night = {
        distance: total_dist_night,
        hard_brakes_avg: data.night.hard_brakes.sum * extrapolation_night,
        hard_accels_avg: data.night.hard_accels.sum * extrapolation_night,
        percent: (total_dist_night / (total_dist_day + total_dist_night)),
        percent_100: (100 * total_dist_night / (total_dist_day + total_dist_night)),
        deductions: {
            hard_brakes: 0,
            hard_accels: 0,
            distance: 0
        },
        score: 0
    };
    console.log("tofixed", (total_dist_day / (total_dist_day + total_dist_night)).toFixed(2));
    setScore(data.calculated.day, true);
    setScore(data.calculated.night, false);

    const weightConstants = {
        day: .4,
        night: .6
    };

    const adjustedWeights = {
        day: data.calculated.day.percent * weightConstants.day,
        night: data.calculated.night.percent * weightConstants.night
    };

    const effectiveWeights = {
        day: 1 / (adjustedWeights.day + adjustedWeights.night) * adjustedWeights.day,
        night: 1 / (adjustedWeights.day + adjustedWeights.night) * adjustedWeights.night
    };

    data.calculated.score = bound(data.calculated.day.score * effectiveWeights.day + data.calculated.night.score * effectiveWeights.night, 0, 100);
    data.calculated.day.deductions = numToFixed(data.calculated.day.deductions, 2);
    data.calculated.night.deductions = numToFixed(data.calculated.night.deductions, 2);
    console.log("calc score", data.calculated.score);
    const score = data.calculated.score;
    data.calculated = numToFixed(data.calculated, 2);

    let total_duration = (sum(durations) / durations.length / 60);

    console.log(score);
    let letterGrade = "https://i.imgur.com/GWJ2a2Y.png"; //F
    if (score > 60 && score <= 70) letterGrade = "https://i.imgur.com/Smz9Wbg.png"; //D
    if (score > 70 && score <= 80) letterGrade = "https://i.imgur.com/X66lskd.png"; //C
    if (score > 80 && score <= 90) letterGrade = "https://i.imgur.com/OwjbEgo.png"; //B
    if (score > 90) letterGrade = "https://i.imgur.com/IexnhBR.png"; //A

    res.render('index', {
        request: req,
        data: {
            day: numToFixed(data.calculated.day, 2),
            night: numToFixed(data.calculated.night, 2),
            score: score.toFixed(2)
        },
        total_distance: total_distance.toFixed(2),
        total_duration: {
            hours: Math.floor(total_duration),
            minutes: Math.floor((total_duration - Math.floor(total_duration)) * 60)
        },
        num_trips: numTrips,
        letterGrade: letterGrade
    });
});

module.exports = router;
