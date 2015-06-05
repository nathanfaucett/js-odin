module.exports = randFloat;


function randFloat(random, min, max) {
    return min + (random() * (max - min));
}
