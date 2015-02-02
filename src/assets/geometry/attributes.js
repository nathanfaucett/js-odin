var isString = require("is_string"),
    indexOf = require("index_of");


module.exports = Attributes;


function Attributes() {
    this.destructor();
}

Attributes.create = function() {
    return new Attributes().construct();
};

Attributes.prototype.construct = function() {

    this.__array = [];
    this.__hash = {};

    return this;
};

Attributes.prototype.destructor = function() {

    this.__array = null;
    this.__hash = null;

    return this;
};

Attributes.prototype.forEach = function(fn) {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        if (fn(array[i], i) === false) {
            return false;
        }
    }

    return this;
};

Attributes.prototype.get = function(name) {

    return this.__hash[name];
};

Attributes.prototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Attributes_add(this, arguments[i]);
    }

    return this;
};

function Attributes_add(_this, attribute) {
    var hash = _this.__hash,
        array = _this.__array,
        name = attribute.name;

    if (!hash[name]) {
        hash[name] = attribute;
        array[array.length] = attribute;
    } else {
        throw new Error("Attributes add(attribute) attributes already have attribute named " + name);
    }
}

Attributes.prototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Attributes_remove(this, arguments[i]);
    }

    return this;
};

function Attributes_remove(_this, attribute) {
    var hash = _this.__hash,
        array = _this.__array,
        name;

    attribute = isString(attribute) ? hash[attribute] : attribute;
    name = attribute.name;

    if (!hash[name]) {
        delete hash[name];
        array.splice(indexOf(array, attribute), 1);
    } else {
        throw new Error("Attributes add(attribute) attributes already have attribute named " + name);
    }
}
