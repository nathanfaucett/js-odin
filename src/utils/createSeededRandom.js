var MULTIPLIER = 1664525,
    MODULO = 4294967295,
    OFFSET = 1013904223;


module.exports = createSeededRandom;


function createSeededRandom() {
    var seed = 0;

    function random(t) {
        return ((MULTIPLIER * (seed + (t * 1000)) + OFFSET) % MODULO) / MODULO;
    }

    random.seed = function(value) {
        seed = value;
    };

    return random;
}
