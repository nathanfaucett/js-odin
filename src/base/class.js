var type = require("type"),
    utils = require("utils"),
    EventEmitter = require("event_emitter");


var CLASS_ID = 1;


module.exports = Class;


function Class() {

    EventEmitter.call(this, -1);

    this.destruct();
}
EventEmitter.extend(Class);

Class.extend = function(child, className) {

    Class.__classes[className] = child;

    utils.inherits(child, this);
    child.extend = this.extend;
    child.create = this.create;
    child.className = child.prototype.className = className;

    if (type.isFunction(this.onExtend)) {
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

    this.__id = CLASS_ID++;

    return this;
};

Class.prototype.destruct = function() {

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
