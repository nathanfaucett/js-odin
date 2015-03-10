var indexOf = require("index_of"),
    Touch = require("./touch");


module.exports = Touches;


function Touches() {
    this.__array = [];
}

Touches.create = function() {
    return (new Touches()).construct();
};

Touches.prototype.construct = function() {
    return this;
};

Touches.prototype.destructor = function() {
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

Touches.prototype.__start = function(targetTouch) {
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

Touches.prototype.__end = function(changedTouch) {
    var array = this.__array,
        touch = findTouch(array, changedTouch.identifier);

    if (touch !== null) {
        array.splice(indexOf(array, touch), 1);
    }

    return touch;
};

Touches.prototype.__move = function(changedTouch) {
    var touch = findTouch(this.__array, changedTouch.identifier);

    if (touch !== null) {
        touch.update(changedTouch);
    }

    return touch;
};

Touches.prototype.get = function(index) {
    return this.__array[index];
};

Touches.prototype.allOff = function() {
    var array = this.__array,
        i = array.length;

    while (i--) {
        array[i].destroy();
    }
    array.length = 0;
};

Touches.prototype.toJSON = function(json) {

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

Touches.prototype.fromJSON = function(json) {
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
