var indexOf = require("index_of"),
    Class = require("../../class");


var ClassPrototype = Class.prototype;


module.exports = ComponentManager;


function ComponentManager() {

    Class.call(this);

    this.scene = null;
    this.__components = [];
}

ComponentManager.onExtend = function(child, className, order) {
    child.order = child.prototype.order = order != null ? order : 0;
};

Class.extend(ComponentManager, "ComponentManager");

ComponentManager.order = ComponentManager.prototype.order = 0;

ComponentManager.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

ComponentManager.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.scene = null;
    this.__components.length = 0;

    return this;
};

ComponentManager.prototype.onAddToScene = function() {
    return this;
};

ComponentManager.prototype.onRemoveFromScene = function() {
    return this;
};

ComponentManager.prototype.isEmpty = function() {

    return this.__components.length === 0;
};

ComponentManager.prototype.sort = function() {
    this.__components.sort(this.sortFunction);
    return this;
};

ComponentManager.prototype.sortFunction = function() {
    return 0;
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

ComponentManager.prototype.has = function(component) {
    return indexOf(this.__components, component) !== -1;
};

ComponentManager.prototype.add = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index === -1) {
        components[components.length] = component;
    }

    return this;
};

ComponentManager.prototype.remove = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index !== -1) {
        components.splice(index, 1);
    }

    return this;
};
