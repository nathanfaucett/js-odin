var isString = require("is_string"),
    isNumber = require("is_number"),
    Class = require("../Class"),
    BaseApplication = require("./BaseApplication");


var BaseApplicationPrototype = BaseApplication.prototype,
    ApplicationPrototype;


module.exports = Application;


function Application() {
    BaseApplication.call(this);
}
BaseApplication.extend(Application, "odin.Application");
ApplicationPrototype = Application.prototype;

ApplicationPrototype.construct = function() {

    BaseApplicationPrototype.construct.call(this);

    return this;
};

ApplicationPrototype.destructor = function() {

    BaseApplicationPrototype.destructor.call(this);

    return this;
};

ApplicationPrototype.setElement = function(element) {

    this.__loop.setElement(element);

    return this;
};

ApplicationPrototype.createScene = function(scene) {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash,
        newScene;

    if (isString(scene)) {
        scene = sceneHash[scene];
    } else if (isNumber(scene)) {
        scene = scenes[scene];
    }

    if (sceneHash[scene.name]) {
        newScene = Class.createFromJSON(scene);

        newScene.application = this;
        newScene.init();

        this.emit("createScene", newScene);

        newScene.awake();

        return newScene;
    } else {
        throw new Error("Application.createScene(scene) Scene could not be found in Application");
    }

    return null;
};

ApplicationPrototype.init = function() {

    BaseApplicationPrototype.init.call(this);

    return this;
};

ApplicationPrototype.loop = function() {

    BaseApplicationPrototype.loop.call(this);

    return this;
};
