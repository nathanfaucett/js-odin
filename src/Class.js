var has = require("has"),
    isNull = require("is_null"),
    isFunction = require("is_function"),
    inherits = require("inherits"),
    EventEmitter = require("event_emitter"),
    createPool = require("create_pool"),
    uuid = require("uuid");


var ClassPrototype;


module.exports = Class;


function Class() {

    EventEmitter.call(this, -1);

    this.__id = null;
}
EventEmitter.extend(Class);
createPool(Class);
ClassPrototype = Class.prototype;

Class.extend = function(Child, className) {
    if (has(Class.__classes, className)) {
        throw new Error("extend(Child, className) class named " + className + " already defined");
    } else {
        Class.__classes[className] = Child;

        inherits(Child, this);
        createPool(Child);
        Child.className = Child.prototype.className = className;

        if (isFunction(this.onExtend)) {
            this.onExtend.apply(this, arguments);
        }

        return Child;
    }
};

Class.inherit = Class.extend;

Class.__classes = {};

Class.hasClass = function(className) {
    return has(Class.__classes, className);
};

Class.getClass = function(className) {
    if (Class.hasClass(className)) {
        return Class.__classes[className];
    } else {
        throw new Error("getClass(className) class named " + className + " is not defined");
    }
};

Class.newClass = function(className) {
    return new(Class.getClass(className))();
};

Class.fromJSON = function(json) {
    return (Class.newClass(json.className)).fromJSON(json);
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

ClassPrototype.generateNewId = function() {

    this.__id = uuid();

    return this;
};

ClassPrototype.toJSON = function(json) {
    json = json || {};

    json.className = this.className;

    return json;
};

ClassPrototype.fromJSON = function( /* json */ ) {

    if (isNull(this.__id)) {
        this.generateNewId();
    }

    return this;
};
