var has = require("has"),
    isFunction = require("is_function"),
    inherits = require("inherits"),
    EventEmitter = require("event_emitter"),
    uuid = require("uuid");


var ClassPrototype;


module.exports = Class;


function Class() {

    EventEmitter.call(this, -1);

    this.__id = null;
}
EventEmitter.extend(Class);
ClassPrototype = Class.prototype;

Class.extend = function(child, className) {
    if (has(Class.__classes, className)) {
        throw new Error("extend(Child, className) class named " + className + " already defined");
    }

    Class.__classes[className] = child;

    inherits(child, this);
    child.className = child.prototype.className = className;

    if (isFunction(this.onExtend)) {
        this.onExtend.apply(this, arguments);
    }

    return child;
};

Class.__classes = {};

Class.getClass = function(className) {
    return Class.__classes[className];
};

Class.createFromJSON = function(json) {
    return Class.getClass(json.className).create().fromJSON(json);
};

Class.className = ClassPrototype.className = "Class";

Class.create = function() {
    var instance = new this();
    return instance.construct.apply(instance, arguments);
};

ClassPrototype.construct = function() {

    this.__id = uuid();

    return this;
};

ClassPrototype.destructor = function() {

    this.__id = null;

    return this;
};

ClassPrototype.toJSON = function(json) {
    json = json || {};

    json.className = this.className;

    return json;
};

ClassPrototype.fromJSON = function( /* json */ ) {
    return this;
};
