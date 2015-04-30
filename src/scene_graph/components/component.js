var camelize = require("camelize"),
    Class = require("../../class"),
    ComponentManager = require("../component_managers/component_manager");


var ClassPrototype = Class.prototype,
    ComponentPrototype;


module.exports = Component;


function Component() {

    Class.call(this);

    this.manager = null;
    this.sceneObject = null;
}

Component.onExtend = function(child, className, manager) {
    manager = manager || ComponentManager;

    child.memberName = child.prototype.memberName = camelize(child.className, true);
    child.Manager = child.prototype.Manager = manager;
    manager.prototype.componentName = child.className;
};

Class.extend(Component, "Component");
ComponentPrototype = Component.prototype;

Component.className = ComponentPrototype.className = "Component";
Component.memberName = ComponentPrototype.memberName = camelize(Component.className, true);
Component.Manager = ComponentPrototype.Manager = ComponentManager;

ComponentPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

ComponentPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.manager = null;
    this.sceneObject = null;

    return this;
};

ComponentPrototype.init = function() {

    this.emit("init");
    return this;
};

ComponentPrototype.clear = function(emitEvent) {

    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ComponentPrototype.awake = function() {

    this.emit("awake");
    return this;
};

ComponentPrototype.update = function() {

    this.emit("update");
    return this;
};

ComponentPrototype.destroy = function(emitEvent) {
    var sceneObject = this.sceneObject;

    if (!sceneObject) {
        return this;
    }

    if (emitEvent !== false) {
        this.clear(emitEvent);
        this.emit("destroy");
    }
    sceneObject.removeComponent(this);

    return this;
};
