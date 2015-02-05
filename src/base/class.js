var isFunction = require("is_function"),
    inherits = require("inherits"),
    EventEmitter = require("event_emitter"),
    uuid = require("./uuid");


module.exports = Class;


function Class() {

    EventEmitter.call(this, -1);

    this.destructor();
}
EventEmitter.extend(Class);

Class.extend = function(child, className) {

    Class.__classes[className] = child;

    inherits(child, this);
    child.extend = this.extend;
    child.create = this.create;
    child.className = child.prototype.className = className;

    if (isFunction(this.onExtend)) {
        this.onExtend.apply(this, arguments);
    }

    return child;
};

Class.__classes = {};

Class.createFromJSON = function(json) {
    return Class.__classes[json.className].create().fromJSON(json);
};

Class.className = Class.prototype.className = "Class";

Class.create = function() {
    var instance = new this();
    return instance.construct.apply(instance, arguments);
};

Class.prototype.construct = function() {

    this.__id = uuid();

    return this;
};

Class.prototype.destructor = function() {

    this.__id = null;

    return this;
};

Class.prototype.toJSON = function(json) {
    json = json || {};

    json.className = this.className;

    return json;
};

Class.prototype.fromJSON = function(json) {

    this.className = json.className;

    return this;
};
