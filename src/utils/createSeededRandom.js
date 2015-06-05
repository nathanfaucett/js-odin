var MULTIPLIER = 1664525,
    MODULO = 4294967295,
    OFFSET = 1013904223;


module.exports = createSeededRandom;


function createSeededRandom(seed) {
    return function random(s) {
        return ((MULTIPLIER * (seed + (s * 1000)) + OFFSET) % MODULO) / MODULO;
    };
}
