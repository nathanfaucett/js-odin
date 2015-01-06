var type = require("type"),
    Class = require("../base/class"),
    Canvas = require("./canvas"),
    BaseApplication = require("./base_application");


var BaseApplicationPrototype = BaseApplication.prototype;


module.exports = Application;


function Application() {
    BaseApplication.call(this);
}
BaseApplication.extend(Application, "Application");

Application.prototype.construct = function(options) {

    options = options || {};

    this.canvas = options.useCanvas === false ? null : Canvas.create(options.canvas);

    BaseApplicationPrototype.construct.call(this);

    return this;
};

Application.prototype.destruct = function() {

    BaseApplicationPrototype.destruct.call(this);

    this.scene = null;
    this.camera = null;
    this.canvas = null;

    return this;
};

Application.prototype.setScene = function(scene) {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash;

    if (type.isString(scene)) {
        scene = sceneHash[scene];
    } else if (type.isNumber(scene)) {
        scene = scenes[scene];
    }

    if (sceneHash[scene.name]) {
        if (this.scene) {
            this.scene.destroy();
        }

        scene = Class.createFromJSON(scene);
        this.scene = scene;

        scene.application = this;
        scene.init();

        this.emit("setScene", scene);
    } else {
        throw new Error("Application.setScene(scene) Scene could not be found in Application");
    }

    return this;
};

Application.prototype.setCamera = function(sceneObject) {
    var scene = this.scene,
        lastCamera = this.camera,
        camera;

    if (!scene) {
        throw new Error("Application.setCamera: can't set camera without an active scene, use Application.setScene first");
    }

    if (!scene.has(sceneObject)) {
        throw new Error("Application.setCamera: SceneObject is not a member of the active Scene, adding it...");
    }

    camera = this.camera = sceneObject.getComponent("camera") || sceneObject.getComponent("camera2d");

    if (camera) {
        camera.__active = true;
        if (lastCamera) {
            lastCamera.__active = false;
        }

        this.emit("setCamera", camera);
    } else {
        throw new Error("Application.setCamera: SceneObject does't have a Camera or a Camera2D Component");
    }

    return this;
};

Application.prototype.init = function() {

    BaseApplicationPrototype.init.call(this);

    return this;
};

Application.prototype.loop = function() {
    var scene = this.scene,
        camera = this.camera;

    if (scene) {
        scene.update();

        if (camera) {

        }
    }
};
