module.exports = randFloat;


function randFloat(random, min, max, t) {
    return min + (random(t) * (max - min));
}
