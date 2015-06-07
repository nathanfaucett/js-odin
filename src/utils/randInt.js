var mathf = require("mathf");


module.exports = randInt;


function randInt(random, min, max) {
    return mathf.round(min + (random() * (max - min)));
}
