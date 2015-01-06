var type = require("type"),
    Class = require("../base/class"),
    Scene = require("../scene_graph/scene"),
    createLoop = require("./create_loop");


var ClassPrototype = Class.prototype;


module.exports = BaseApplication;


function BaseApplication() {

    Class.call(this);
}
Class.extend(BaseApplication, "BaseApplication");

BaseApplication.prototype.construct = function() {
    var _this = this;

    ClassPrototype.construct.call(this);

    this.__scenes = [];
    this.__sceneHash = {};

    this.__loop = createLoop(function(ms) {
        _this.loop(ms);
    }, this.canvas ? this.canvas.element : undefined);

    return this;
};

BaseApplication.prototype.destruct = function() {

    ClassPrototype.destruct.call(this);

    this.__scenes = null;
    this.__sceneHash = null;

    this.__loop = null;

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

    if (type.isString(scene)) {
        json = sceneHash[scene];
    } else if (type.isNumber(scene)) {
        json = scenes[scene];
    }

    name = json.name;

    if (sceneHash[name]) {

        sceneHash[name] = null;
        utils.remove(scenes, json);

        _this.emit("removeScene", name);
    } else {
        throw new Error("Application removeScene(...scenes) Scene not a member of Application");
    }
}

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

};
