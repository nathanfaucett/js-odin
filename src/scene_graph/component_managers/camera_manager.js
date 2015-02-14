var ComponentManager = require("./component_manager");


var ComponentManagerPrototype = ComponentManager.prototype;


module.exports = CameraManager;


function CameraManager() {

    ComponentManager.call(this);

    this.__active = null;
}
ComponentManager.extend(CameraManager, "CameraManager");

CameraManager.prototype.construct = function() {

    ComponentManagerPrototype.construct.call(this);

    return this;
};

CameraManager.prototype.destructor = function() {

    ComponentManagerPrototype.destructor.call(this);

    this.__active = null;

    return this;
};

CameraManager.prototype.sortFunction = function(a, b) {
    return a.__active ? 1 : (b.__active ? -1 : 0);
};

CameraManager.prototype.setActive = function(camera) {
    if (this.__active) {
        this.__active.__active = false;
    }

    camera.__active = true;
    this.__active = camera;

    this.sort();

    return this;
};

CameraManager.prototype.getActive = function() {
    return this.__active;
};

CameraManager.prototype.add = function(component) {

    ComponentManagerPrototype.add.call(this, component);

    if (component.__active) {
        this.setActive(component);
    }

    return this;
};

CameraManager.prototype.remove = function(component) {

    ComponentManagerPrototype.remove.call(this, component);

    if (component.__active) {
        this.__active = null;
    }

    return this;
};
