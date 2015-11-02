var indexOf = require("index_of"),
    Class = require("class");


var ClassPrototype = Class.prototype,
    ComponentManagerPrototype;


module.exports = ComponentManager;


function ComponentManager() {

    Class.call(this);

    this.scene = null;
    this.__components = [];
}

ComponentManager.onExtend = function(child, className, order) {
    child.order = child.prototype.order = order != null ? order : 0;
};

Class.extend(ComponentManager, "odin.ComponentManager");
ComponentManagerPrototype = ComponentManager.prototype;

ComponentManager.order = ComponentManagerPrototype.order = 0;

ComponentManagerPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

ComponentManagerPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.scene = null;
    this.__components.length = 0;

    return this;
};

ComponentManagerPrototype.onAddToScene = function() {
    return this;
};

ComponentManagerPrototype.onRemoveFromScene = function() {
    return this;
};

ComponentManagerPrototype.isEmpty = function() {

    return this.__components.length === 0;
};

ComponentManagerPrototype.sort = function() {
    this.__components.sort(this.sortFunction);
    return this;
};

ComponentManagerPrototype.sortFunction = function() {
    return 0;
};

ComponentManagerPrototype.init = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].init();
    }

    return this;
};

ComponentManagerPrototype.awake = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].awake();
    }

    return this;
};

ComponentManagerPrototype.update = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].update();
    }

    return this;
};

ComponentManagerPrototype.clear = function(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ComponentManagerPrototype.forEach = function(callback) {
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

ComponentManagerPrototype.has = function(component) {
    return indexOf(this.__components, component) !== -1;
};

ComponentManagerPrototype.addComponent = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index === -1) {
        components[components.length] = component;
    }

    return this;
};

ComponentManagerPrototype.removeComponent = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index !== -1) {
        components.splice(index, 1);
    }

    return this;
};
