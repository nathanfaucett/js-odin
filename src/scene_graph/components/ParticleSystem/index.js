var indexOf = require("index_of"),
    particleState = require("./particleState"),
    Component = require("../Component");


var ComponentPrototype = Component.prototype,
    ParticleSystemPrototype;


module.exports = ParticleSystem;


function ParticleSystem() {

    Component.call(this);

    this.__playing = false;

    this.emitters = [];
    this.__emitterHash = {};
}
Component.extend(ParticleSystem, "odin.ParticleSystem");
ParticleSystemPrototype = ParticleSystem.prototype;

ParticleSystem.Emitter = require("./Emitter");

ParticleSystemPrototype.construct = function(options) {
    var emitters, i, il;

    ComponentPrototype.construct.call(this);

    options = options || {};

    if (options.emitters) {
        emitters = options.emitters;
        i = -1;
        il = emitters.length - 1;

        while (i++ < il) {
            this.addEmitter(emitters[i]);
        }
    }
    if (options.emitter) {
        this.addEmitter(options.emitter);
    }

    if (options.playing) {
        this.play();
    }

    return this;
};

ParticleSystemPrototype.destructor = function() {
    var emitters = this.emitters,
        i = -1,
        il = emitters.length - 1;

    ComponentPrototype.destructor.call(this);

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
    var emitters = _this.emitters,
        index = indexOf(emitters, emitter);

    if (index === -1) {
        emitters[emitters.length] = emitter;
        _this.__emitterHash[emitter.__id] = emitter;
        emitter.particleSystem = _this;
    } else {
        throw new Error("ParticleSystem addEmitter(emitter): emitter already in particle system");
    }
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
    var emitters = _this.emitters,
        index = indexOf(emitters, emitter);

    if (index !== -1) {
        emitter.particleSystem = null;
        emitters.splice(index, 1);
        delete _this.__emitterHash[emitter.__id];
    } else {
        throw new Error("ParticleSystem removeEmitter(emitter): emitter not in particle system");
    }
}

ParticleSystemPrototype.update = function() {
    if (this.__playing) {

        this.eachEmitter(ParticleSystem_update.set(this.entity.scene.time, true));

        if (ParticleSystem_update.playing === false) {
            this.__playing = false;
            this.emit("end");
        }
    }
};

function ParticleSystem_update(emitter) {
    emitter.update(ParticleSystem_update.time);
    if (emitter.__state === particleState.NONE) {
        ParticleSystem_update.playing = false;
    }
}
ParticleSystem_update.set = function(time, playing) {
    this.time = time;
    this.playing = playing;
    return this;
};

ParticleSystemPrototype.play = function() {
    if (!this.__playing) {
        this.__playing = true;
        this.eachEmitter(ParticleSystem_play);
        this.emit("play");
    }
};

function ParticleSystem_play(emitter) {
    emitter.play();
}

ParticleSystemPrototype.eachEmitter = function(fn) {
    var emitters = this.emitters,
        i = -1,
        il = emitters.length - 1;

    while (i++ < il) {
        if (fn(emitters[i], i) === false) {
            break;
        }
    }
};

ParticleSystemPrototype.toJSON = function(json) {
    var emitters = this.emitters,
        i = -1,
        il = emitters.length - 1,
        jsonEmitters;

    json = ComponentPrototype.toJSON.call(this, json);

    jsonEmitters = json.emitters || (json.emitters = [])
    json.playing = this.playing;

    while (i++ < il) {
        jsonEmitters[i] = emitters[i].toJSON(jsonEmitters[i]);
    }

    return json;
};

ParticleSystemPrototype.fromJSON = function(json) {
    var jsonEmitters = json.emitters,
        i = -1,
        il = jsonEmitters.length - 1;

    ComponentPrototype.fromJSON.call(this, json);

    while (i++ < il) {
        this.addEmitter(jsonEmitters[i]);
    }

    return this;
};
