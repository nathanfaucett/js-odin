var Touch = require("./touch");


var touchPool = [];


function createTouch() {
    return touchPool.length !== 0 ? touchPool.pop() : new Touch();
}

function destroyTouch(touch) {
    touchPool[touchPool.length] = touch;
}


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

Touches.prototype.__start = function(index, targetTouch) {
    var array = this.__array,
        touch = createTouch();

    touch.id = targetTouch.identifier;
    touch.index = index;
    touch.update(targetTouch);

    array[array.length] = touch;

    return touch;
};

Touches.prototype.__end = function(index) {
    var array = this.__array,
        touch = array[index];

    array.splice(index, 1);
    destroyTouch(touch);
    touch.__first = false;

    return touch;
};

Touches.prototype.__move = function(index, targetTouch) {
    var array = this.__array,
        touch = array[index];

    touch.update(targetTouch);
    return touch;
};

Touches.prototype.allOff = function() {
    var array = this.__array,
        i = array.length;

    while (i--) {
        destroyTouch(array[i]);
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
        button = createTouch();
        button.fromJSON(jsonArray[i]);

        array[array.length] = button;
        hash[button.name] = button;
    }

    return this;
};
