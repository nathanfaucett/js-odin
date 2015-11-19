var isString = require("is_string"),
    isNumber = require("is_number"),
    indexOf = require("index_of"),
    Class = require("class"),
    createLoop = require("create_loop"),
    Assets = require("../Assets"),
    Scene = require("../Scene");


var ClassPrototype = Class.prototype,
    BaseApplicationPrototype;


module.exports = BaseApplication;


function BaseApplication() {
    var _this = this;

    Class.call(this);

    this.assets = Assets.create();

    this.__scenes = [];
    this.__sceneHash = {};

    this.__loop = createLoop(function loop() {
        _this.loop();
    }, null);

}
Class.extend(BaseApplication, "odin.BaseApplication");
BaseApplicationPrototype = BaseApplication.prototype;

BaseApplicationPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

BaseApplicationPrototype.destructor = function() {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash,
        i = -1,
        il = scenes.length - 1,
        scene;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        scene = scenes[i];
        scene.destructor();
        delete sceneHash[scene.name];
        scenes.splice(i, 1);
    }

    this.assets.destructor();
    this.__loop.pause();

    return this;
};

BaseApplicationPrototype.init = function() {

    this.__loop.run();
    this.emit("init");

    return this;
};

BaseApplicationPrototype.pause = function() {

    this.__loop.pause();
    this.emit("pause");

    return this;
};

BaseApplicationPrototype.resume = function() {

    this.__loop.run();
    this.emit("resume");

    return this;
};

BaseApplicationPrototype.isRunning = function() {
    return this.__loop.isRunning();
};

BaseApplicationPrototype.isPaused = function() {
    return this.__loop.isPaused();
};

BaseApplicationPrototype.loop = function() {

    this.emit("loop");

    return this;
};

BaseApplicationPrototype.addScene = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        BaseApplication_addScene(this, arguments[i]);
    }
    return this;
};

function BaseApplication_addScene(_this, scene) {
    var scenes = _this.__scenes,
        sceneHash = _this.__sceneHash,
        name = scene.name,
        json;

    if (!sceneHash[name]) {
        json = (scene instanceof Scene) ? scene.toJSON() : scene;

        sceneHash[name] = json;
        scenes[scenes.length] = json;

        _this.emit("addScene", name);
    } else {
        throw new Error("Application addScene(...scenes) Scene is already a member of Application");
    }
}

BaseApplicationPrototype.removeScene = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        BaseApplication_removeScene(this, arguments[i]);
    }
    return this;
};

function BaseApplication_removeScene(_this, scene) {
    var scenes = _this.__scenes,
        sceneHash = _this.__sceneHash,
        json, name;

    if (isString(scene)) {
        json = sceneHash[scene];
    } else if (isNumber(scene)) {
        json = scenes[scene];
    }

    name = json.name;

    if (sceneHash[name]) {

        sceneHash[name] = null;
        scenes.splice(indexOf(scenes, json), 1);

        _this.emit("removeScene", name);
    } else {
        throw new Error("Application removeScene(...scenes) Scene not a member of Application");
    }
}
