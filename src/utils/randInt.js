var mathf = require("mathf");


module.exports = randInt;


function randInt(random, min, max, t) {
    return mathf.round(min + (random(t) * (max - min)));
}
