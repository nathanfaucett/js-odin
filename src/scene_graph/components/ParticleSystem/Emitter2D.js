var mathf = require("mathf"),
    isNumber = require("is_number"),
    Class = require("../../../Class"),
    randInt = require("../../../utils/randInt"),
    randFloat = require("../../../utils/randFloat"),
    createSeededRandom = require("../../../utils/createSeededRandom"),
    Particle2D = require("./Particle2D");


var MAX_SAFE_INTEGER = mathf.pow(2, 53) - 1,
    ClassPrototype = Class.prototype,
    Emitter2DPrototype;


module.exports = Emitter2D;


function Emitter2D() {
    var _this = this;

    Class.call(this);

    this.seed = null;
    this.__random = null;

    this.minEmission = null;
    this.maxEmission = null;

    this.playing = false;

    this.particleSystem = null;

    this.startTime = null;
    this.currentTime = null;

    this.particles = [];

    this.random = function random() {
        return _this.__random(this.currentTime);
    };
}
Class.extend(Emitter2D, "odin.ParticleSystem.Emitter2D");
Emitter2DPrototype = Emitter2D.prototype;

Emitter2DPrototype.construct = function(options) {

    ClassPrototype.construct.call(this);

    options = options || {};

    this.seed = mathf.floor(isNumber(options.seed) ? (
        options.seed > MAX_SAFE_INTEGER ? MAX_SAFE_INTEGER : options.seed
    ) : (mathf.random() * MAX_SAFE_INTEGER));

    this.__random = createSeededRandom(this.seed);

    this.minEmission = options.minEmission != null ? options.minEmission : 1;
    this.maxEmission = options.maxEmission != null ? options.maxEmission : 2;

    this.playing = false;

    this.startTime = 0.0;
    this.currentTime = 0.0;

    return this;
};

Emitter2DPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.seed = null;
    this.__random = null;

    this.minEmission = null;
    this.maxEmission = null;

    this.playing = false;

    this.startTime = 0.0;
    this.currentTime = 0.0;

    this.particles.length = 0;

    return this;
};

Emitter2DPrototype.update = function() {

    this.currentTime = this.particleSystem.entity.scene.time.time - this.startTime;

    return this;
};

Emitter2DPrototype.spawn = function() {
    var count = randInt(this.random, this.minEmission, this.maxEmission);

    console.log(count);

    return this;
};

Emitter2DPrototype.play = function() {
    if (!this.playing) {
        this.startTime = this.particleSystem.entity.scene.time.time;
        this.playing = true;
    }
    return this;
};

Emitter2DPrototype.toJSON = function(json) {

    json = ClassPrototype.toJSON.call(this, json);

    json.seed = this.seed;

    return json;
};

Emitter2DPrototype.fromJSON = function(json) {

    ClassPrototype.fromJSON.call(this, json);

    this.seed = json.seed;
    this.__random = createSeededRandom(this.seed);

    return this;
};
