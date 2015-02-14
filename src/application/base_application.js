var isString = require("is_string"),
    isNumber = require("is_number"),
    indexOf = require("index_of"),
    Class = require("../class"),
    Assets = require("../assets/assets"),
    createLoop = require("create_loop"),
    Scene = require("../scene_graph/scene");


var ClassPrototype = Class.prototype;


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
Class.extend(BaseApplication, "BaseApplication");

BaseApplication.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

BaseApplication.prototype.destructor = function() {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash,
        i = scenes.length,
        scene;

    ClassPrototype.destructor.call(this);

    while (i--) {
        scene = scenes[i];
        scene.destructor();
        delete sceneHash[scene.name];
        scenes.splice(i, 1);
    }

    this.assets.destructor();
    this.__loop.pause();

    return this;
};

BaseApplication.prototype.init = function() {

    this.__loop.run();
    this.emit("init");

    return this;
};

BaseApplication.prototype.pause = function() {

    this.__loop.pause();
    this.emit("pause");

    return this;
};

BaseApplication.prototype.resume = function() {

    this.__loop.run();
    this.emit("resume");

    return this;
};

BaseApplication.prototype.isRunning = function() {
    return this.__loop.isRunning();
};

BaseApplication.prototype.isPaused = function() {
    return this.__loop.isPaused();
};

BaseApplication.prototype.loop = function() {

    this.emit("loop");

    return this;
};

BaseApplication.prototype.addScene = function() {
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

BaseApplication.prototype.removeScene = function() {
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
