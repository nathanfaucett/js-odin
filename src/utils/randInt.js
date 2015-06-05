module.exports = randInt;


function randInt(random, min, max) {
    return (min + (random() * (max - min))) >>> 0;
}
