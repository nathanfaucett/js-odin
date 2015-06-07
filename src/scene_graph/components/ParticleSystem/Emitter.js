var indexOf = require("index_of"),
    isNumber = require("is_number"),
    mathf = require("mathf"),
    vec2 = require("vec2"),
    vec3 = require("vec3"),
    quat = require("quat"),
    particleState = require("./particleState"),
    normalMode = require("../../../enums/normalMode"),
    emitterRenderMode = require("../../../enums/emitterRenderMode"),
    interpolation = require("../../../enums/interpolation"),
    screenAlignment = require("../../../enums/screenAlignment"),
    sortMode = require("../../../enums/sortMode"),
    createSeededRandom = require("../../../utils/createSeededRandom"),
    randFloat = require("../../../utils/randFloat"),
    Class = require("../../../Class");


var MAX_SAFE_INTEGER = mathf.pow(2, 53) - 1,
    ClassPrototype = Class.prototype,
    EmitterPrototype;


module.exports = Emitter;


function Emitter() {
    var _this = this;

    Class.call(this);

    this.__state = particleState.NONE;
    this.__currentTime = 0.0;
    this.__random = createSeededRandom();

    this.seed = null;

    this.renderMode = null;

    this.particleSystem = null;
    this.particles = [];

    this.material = null;

    this.screenAlignment = null;
    this.useLocalSpace = null;

    this.killOnDeactivate = false;
    this.killOnCompleted = false;

    this.sortMode = null;

    this.__duration = 0.0;
    this.duration = 0.0;
    this.minDuration = 0.0;
    this.useDurationRange = false;
    this.recalcDurationRangeEachLoop = false;

    this.__delay = 0.0;
    this.__currentDelayTime = 0.0;
    this.delay = 0.0;
    this.minDelay = 0.0;
    this.useDelayRange = false;
    this.delayFirstLoopOnly = false;

    this.__currentLoop = 0;
    this.loopCount = 0;

    this.subUV = false;

    this.interpolation = null;

    this.subImagesX = 1;
    this.subImagesY = 1;

    this.scaleUV = vec2.create(1, 1);

    this.randomImageChanges = 1;

    this.useMaxDrawCount = false;
    this.maxDrawCount = 0;

    this.normalMode = null;

    this.rate = 60;
    this.rateScale = 1;

    this.burst = false;
    this.burstScale = 1;

    this.modules = {};
    this.__moduleArray = [];

    this.random = function random() {
        return _this.__random(_this.__currentTime);
    };
}
Class.extend(Emitter, "odin.ParticleSystem.Emitter");
EmitterPrototype = Emitter.prototype;

EmitterPrototype.construct = function(options) {
    var modules, i, il;

    ClassPrototype.construct.call(this);

    options = options || {};

    this.seed = mathf.floor(isNumber(options.seed) ? (
        options.seed > MAX_SAFE_INTEGER ? MAX_SAFE_INTEGER : options.seed
    ) : (mathf.random() * MAX_SAFE_INTEGER));

    this.__random.seed(this.seed);

    this.renderMode = options.renderMode || emitterRenderMode.NORMAL;

    this.material = options.material || null;

    this.screenAlignment = options.screenAlignment || screenAlignment.FACING_CAMERA_POSITION;
    this.useLocalSpace = options.useLocalSpace ? !!options.useLocalSpace : false;

    this.killOnDeactivate = options.killOnDeactivate ? !!options.killOnDeactivate : false;
    this.killOnCompleted = options.killOnCompleted ? !!options.killOnCompleted : false;

    this.sortMode = options.sortMode || sortMode.VIEW_PROJ_DEPTH;

    this.duration = options.duration ? options.duration : 0.0;
    this.minDuration = options.minDuration ? options.minDuration : 0.0;
    this.useDurationRange = options.useDurationRange ? !!options.useDurationRange : false;
    this.recalcDurationRangeEachLoop = options.recalcDurationRangeEachLoop ? !!options.recalcDurationRangeEachLoop : false;

    this.delay = options.delay ? options.delay : 0.0;
    this.minDelay = options.minDelay ? options.minDelay : 0.0;
    this.useDelayRange = options.useDelayRange ? !!options.useDelayRange : false;
    this.delayFirstLoopOnly = options.delayFirstLoopOnly ? !!options.delayFirstLoopOnly : false;

    this.__currentLoop = 0;
    this.loopCount = options.loopCount ? options.loopCount : 0;

    this.subUV = options.subUV ? !!options.subUV : false;

    this.interpolation = options.interpolation || interpolation.NONE;

    this.subImagesX = options.subImagesX ? options.subImagesX : 1;
    this.subImagesY = options.subImagesY ? options.subImagesY : 1;

    if (options.scaleUV) {
        vec2.copy(this.scaleUV, options.scaleUV);
    }

    this.randomImageChanges = options.randomImageChanges ? options.randomImageChanges : 1;

    this.useMaxDrawCount = options.useMaxDrawCount ? !!options.useMaxDrawCount : false;
    this.maxDrawCount = options.maxDrawCount ? options.maxDrawCount : 0;

    this.normalMode = options.normalMode || normalMode.CAMERA_FACING;

    this.rate = options.rate ? options.rate : 24;
    this.rateScale = options.rateScale ? options.rateScale : 1;

    this.burst = options.burst ? !!options.burst : false;
    this.burstScale = options.burstScale ? options.burstScale : 1;

    if (options.modules) {
        modules = options.modules;
        i = -1;
        il = modules.length - 1;

        while (i++ < il) {
            this.addModule(modules[i]);
        }
    }
    if (options.module) {
        this.addModule(options.module);
    }

    return this;
};

EmitterPrototype.destructor = function() {
    var moduleArray = this.__moduleArray,
        i = -1,
        il = moduleArray.length - 1;

    ClassPrototype.destructor.call(this);

    this.__state = particleState.NONE;

    this.seed = null;

    this.renderMode = null;

    this.particleSystem = null;
    this.particles.length = 0;

    this.material = null;

    this.screenAlignment = null;
    this.useLocalSpace = null;

    this.killOnDeactivate = false;
    this.killOnCompleted = false;

    this.sortMode = null;

    this.duration = 0.0;
    this.minDuration = 0.0;
    this.useDurationRange = false;
    this.recalcDurationRangeEachLoop = false;

    this.delay = 0.0;
    this.minDelay = 0.0;
    this.useDelayRange = false;
    this.delayFirstLoopOnly = false;

    this.__currentLoop = 0;
    this.loopCount = 0;

    this.subUV = false;

    this.interpolation = null;

    this.subImagesX = 1;
    this.subImagesY = 1;

    vec2.set(this.scaleUV, 1, 1);

    this.randomImageChanges = 1;

    this.useMaxDrawCount = false;
    this.maxDrawCount = 0;

    this.normalMode = null;

    this.rate = 60;
    this.rateScale = 1;

    this.burst = false;
    this.burstScale = 1;

    while (i++ < il) {
        this.removeModule(moduleArray[i]);
    }

    return this;
};

EmitterPrototype.addModule = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Emitter_addModule(this, arguments[i]);
    }

    return this;
};

function Emitter_addModule(_this, module) {
    var moduleArray = _this.__moduleArray,
        moduleHash = _this.modules,
        className = module.className;

    if (!moduleHash[className]) {
        moduleArray[moduleArray.length] = module;
        moduleHash[className] = module;
        module.emitter = _this;
    } else {
        throw new Error("Emitter addModule(module): module " + className + " already in emitter");
    }
}

EmitterPrototype.removeModule = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Emitter_removeModule(this, arguments[i]);
    }

    return this;
};

function Emitter_removeModule(_this, module) {
    var moduleArray = _this.__moduleArray,
        moduleHash = _this.modules,
        className = module.className;

    if (moduleHash[className]) {
        moduleArray.splice(indexOf(moduleArray, module), 1);
        delete moduleHash[className];
        module.emitter = _this;
    } else {
        throw new Error("Emitter removeModule(module): module " + className + " not in emitter");
    }
}

EmitterPrototype.update = function(time) {
    var state = this.__state;

    if (state !== particleState.NONE) {

        this.eachModule(EmitterPrototype_updateModule.set(time));

        switch (state) {
            case particleState.START:
                Emitter_start(this, time);
                break;

            case particleState.RUNNING:
                Emitter_running(this, time);
                break;

            case particleState.END:
                Emitter_end(this, time);
                break;
        }
    }
};

function EmitterPrototype_updateModule(module) {
    if (module.update) {
        module.update(EmitterPrototype_updateModule.time);
    }
}
EmitterPrototype_updateModule.set = function(time) {
    this.time = time;
    return this;
};

function Emitter_start(_this, time) {
    if (_this.useDelayRange && _this.__currentDelayTime < _this.__delay) {
        _this.__currentDelayTime += time.fixedDelta;
    } else {
        _this.emit("play");
        _this.__state = particleState.RUNNING;
    }
}

function Emitter_running(_this, time) {
    var currentTime;

    _this.__currentTime += time.fixedDelta;
    currentTime = _this.__currentTime;

    if (_this.__duration > 0.0) {
        if (currentTime >= _this.__duration) {
            _this.__state = particleState.END;
        }
    }
}

function Emitter_end(_this, time) {

    _this.emit("end");
    _this.__currentTime = 0.0;

    if (_this.duration > 0.0 && _this.useDurationRange && _this.recalcDurationRangeEachLoop) {
        _this.__duration = randFloat(_this.random, _this.minDuration, _this.duration);
    }

    if (_this.useDelayRange && !_this.delayFirstLoopOnly) {
        _this.__currentDelayTime = 0.0;
        _this.__delay = randFloat(_this.random, _this.minDelay, _this.delay);
    }

    if (_this.loopCount > 0) {
        if (_this.__currentLoop > _this.loopCount) {
            _this.__state = particleState.NONE;
        } else {
            _this.__currentLoop += 1;
        }
    } else {
        _this.__state = particleState.START;
    }
}

EmitterPrototype.eachModule = function(fn) {
    var moduleArray = this.__moduleArray,
        i = -1,
        il = moduleArray.length - 1;

    while (i++ < il) {
        if (fn(moduleArray[i], i) === false) {
            break;
        }
    }
};

EmitterPrototype.play = function() {
    if (this.__state === particleState.NONE) {

        this.__random.seed(this.seed);

        this.__curentTime = 0.0;
        this.__state = particleState.START;

        if (this.useDurationRange) {
            this.__duration = randFloat(this.random, this.minDuration, this.duration);
        }

        if (this.useDelayRange) {
            this.__currentDelayTime = 0.0;
            this.__delay = randFloat(this.random, this.minDelay, this.delay);
        }
    }
};

EmitterPrototype.toJSON = function(json) {
    var modules = this.modules,
        jsonModules = json.modules || (json.modules = []),
        i = -1,
        il = modules.length - 1;

    json = ClassPrototype.toJSON.call(this, json);

    while (i++ < il) {
        jsonModules[i] = modules[i].toJSON(jsonModules[i]);
    }

    return json;
};

EmitterPrototype.fromJSON = function(json) {
    var jsonModules = json.modules,
        i = -1,
        il = jsonModules.length - 1;

    ClassPrototype.fromJSON.call(this, json);

    while (i++ < il) {
        this.addModule(Class.createFromJSON(jsonModules[i]));
    }

    return this;
};
