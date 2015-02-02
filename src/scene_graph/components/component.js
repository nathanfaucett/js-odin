var camelize = require("camelize"),
    Class = require("../../base/class"),
    ComponentManager = require("../component_managers/component_manager");


var ClassPrototype = Class.prototype;


module.exports = Component;


function Component() {
    Class.call(this);
}

Component.onExtend = function(child, className, manager) {
    child.memberName = child.prototype.memberName = camelize(child.className, true);
    child.manager = child.prototype.manager = manager || ComponentManager;
};

Class.extend(Component, "Component");

Component.className = Component.prototype.className = "Component";
Component.memberName = Component.prototype.memberName = camelize(Component.className, true);
Component.manager = Component.prototype.manager = ComponentManager;

Component.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

Component.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

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

Component.prototype.destroy = function() {
    var sceneObject = this.sceneObject;

    if (!sceneObject) {
        return this;
    }

    this.emit("destroy");
    sceneObject.removeComponent(this);

    return this;
};
