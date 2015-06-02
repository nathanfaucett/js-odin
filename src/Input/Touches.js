var indexOf = require("index_of"),
    Touch = require("./Touch");


var TouchesPrototype;


module.exports = Touches;


function Touches() {
    this.__array = [];
}
TouchesPrototype = Touches.prototype;

Touches.create = function() {
    return (new Touches()).construct();
};

TouchesPrototype.construct = function() {
    return this;
};

TouchesPrototype.destructor = function() {
    this.__array.length = 0;
    return this;
};

function findTouch(array, id) {
    var i = -1,
        il = array.length - 1,
        touch;

    while (i++ < il) {
        touch = array[i];

        if (touch.id === id) {
            return touch;
        }
    }

    return null;
}

TouchesPrototype.__start = function(targetTouch) {
    var array = this.__array,
        oldTouch = findTouch(array, targetTouch.identifier),
        touch;

    if (oldTouch === null) {
        touch = Touch.create(targetTouch);
        array[array.length] = touch;
        return touch;
    } else {
        return oldTouch;
    }
};

TouchesPrototype.__end = function(changedTouch) {
    var array = this.__array,
        touch = findTouch(array, changedTouch.identifier);

    if (touch !== null) {
        array.splice(indexOf(array, touch), 1);
    }

    return touch;
};

TouchesPrototype.__move = function(changedTouch) {
    var touch = findTouch(this.__array, changedTouch.identifier);

    if (touch !== null) {
        touch.update(changedTouch);
    }

    return touch;
};

TouchesPrototype.get = function(index) {
    return this.__array[index];
};

TouchesPrototype.allOff = function() {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].destroy();
    }
    array.length = 0;
};

TouchesPrototype.toJSON = function(json) {

    json = json || {};

    json.array = eachToJSON(this.__array, json.array || []);

    return json;
};

function eachToJSON(array, out) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        out[i] = array[i].toJSON(out[i]);
    }

    return out;
}

TouchesPrototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        button;

    array.length = 0;

    while (i++ < il) {
        button = Touch.create();
        button.fromJSON(jsonArray[i]);

        array[array.length] = button;
        hash[button.name] = button;
    }

    return this;
};
