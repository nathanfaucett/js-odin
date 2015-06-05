var indexOf = require("index_of"),
    Component = require("../Component");


var ComponentPrototype = Component.prototype,
    ParticleSystemPrototype;


module.exports = ParticleSystem;


function ParticleSystem() {

    Component.call(this);

    this.playing = null;

    this.emitters = [];
    this.__emitterHash = {};
}
Component.extend(ParticleSystem, "odin.ParticleSystem");
ParticleSystemPrototype = ParticleSystem.prototype;

ParticleSystem.Emitter = require("./Emitter");
ParticleSystem.Emitter2D = require("./Emitter2D");

ParticleSystemPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    this.playing = options.playing ? !!options.playing : false;

    return this;
};

ParticleSystemPrototype.destructor = function() {
    var emitters = this.emitters,
        i = -1,
        il = emitters.length - 1;

    ComponentPrototype.destructor.call(this);

    this.playing = null;

    while (i++ < il) {
        this.removeEmitter(emitters[i]);
    }

    return this;
};

ParticleSystemPrototype.addEmitter = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ParticleSystem_addEmitter(this, arguments[i]);
    }

    return this;
};

function ParticleSystem_addEmitter(_this, emitter) {
    var emitters = this.emitters,
        index = indexOf(emitters, emitter);

    if (index === -1) {
        emitters[emitters.length] = emitter;
        this.__emitterHash[emitter.__id] = emitter;
        emitter.particleSystem = this;
    } else {
        throw new Error("ParticleSystem addEmitter(emitter): emitter already in particle system");
    }

    return this;
}

ParticleSystemPrototype.removeEmitter = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ParticleSystem_removeEmitter(this, arguments[i]);
    }

    return this;
};

function ParticleSystem_removeEmitter(_this, emitter) {
    var emitters = this.emitters,
        index = indexOf(emitters, emitter);

    if (index !== -1) {
        emitter.clear();
        emitter.particleSystem = null;

        emitters.splice(index, 1);
        delete this.__emitterHash[emitter.__id];
    } else {
        throw new Error("ParticleSystem removeEmitter(emitter): emitter not in particle system");
    }

    return this;
}

ParticleSystemPrototype.update = function() {
    var dt, emitters, playing, i, il, emitter;

    if (this.playing) {
        dt = this.entity.scene.time.delta;
        emitters = this.emitters;
        playing = false;
        i = -1,
            il = emitters.length - 1;

        while (i++ < il) {
            emitter = emitters[i];
            emitter.update(dt);

            if (!playing && emitter.playing) {
                playing = true;
            }
        }

        if (!playing) {
            this.playing = playing;
            this.emit("end");
        }
    }

    return this;
};

ParticleSystemPrototype.play = function() {
    var emitters, i, il;

    if (!this.playing) {
        emitters = this.emitters;
        i = -1;
        il = emitters.length - 1;

        while (i++ < il) {
            emitters[i].play();
        }

        this.playing = true;
        this.emit("play");
    }

    return this;
};

ParticleSystemPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

ParticleSystemPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};
