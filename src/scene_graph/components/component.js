var camelize = require("camelize"),
    Class = require("../../class"),
    ComponentManager = require("../component_managers/component_manager");


var ClassPrototype = Class.prototype;


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

Component.className = Component.prototype.className = "Component";
Component.memberName = Component.prototype.memberName = camelize(Component.className, true);
Component.Manager = Component.prototype.Manager = ComponentManager;

Component.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

Component.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.manager = null;
    this.sceneObject = null;

    return this;
};

Component.prototype.init = function() {

    this.emit("init");
    return this;
};

Component.prototype.awake = function() {

    this.emit("awake");
    return this;
};

Component.prototype.update = function() {

    this.emit("update");
    return this;
};

Component.prototype.destroy = function(emitEvent) {
    var sceneObject = this.sceneObject;

    if (!sceneObject) {
        return this;
    }

    if (emitEvent !== false) {
        this.emit("destroy");
    }
    sceneObject.removeComponent(this);

    return this;
};
