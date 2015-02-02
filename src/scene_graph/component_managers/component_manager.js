var indexOf = require("index_of"),
    Class = require("../../base/class");


var ClassPrototype = Class.prototype;


module.exports = ComponentManager;


function ComponentManager() {

    Class.call(this);
}

ComponentManager.onExtend = function(child, className, order) {

    child.order = child.prototype.order = order != null ? order : 0;
};

Class.extend(ComponentManager, "ComponentManager");

ComponentManager.order = ComponentManager.prototype.order = 0;

ComponentManager.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    this.__components = [];

    return this;
};

ComponentManager.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.__components = null;

    return this;
};

ComponentManager.prototype.isEmpty = function() {

    return this.__components.length === 0;
};

ComponentManager.prototype.__sort = function() {

    this.__components.sort(this.sort);
    return this;
};

ComponentManager.prototype.sort = function(a, b) {

    return a.__id - b.__id;
};

ComponentManager.prototype.init = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].init();
    }

    return this;
};

ComponentManager.prototype.awake = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].awake();
    }

    return this;
};

ComponentManager.prototype.update = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].update();
    }

    return this;
};

ComponentManager.prototype.forEach = function(callback) {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        if (callback(components[i], i) === false) {
            return false;
        }
    }

    return true;
};

ComponentManager.prototype.add = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index === -1) {
        components[components.length] = component;
    }
};

ComponentManager.prototype.remove = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index !== -1) {
        components.splice(index, 1);
    }
};
