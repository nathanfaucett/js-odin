var Button = require("./button");


module.exports = Buttons;


function Buttons() {
    this.__array = [];
    this.__hash = {};
}

Buttons.create = function() {
    return (new Buttons()).construct();
};

Buttons.prototype.construct = function() {

    Buttons_add(this, "mouse0");
    Buttons_add(this, "mouse1");
    Buttons_add(this, "mouse2");

    return this;
};

Buttons.prototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = array.length,
        button;

    while (i--) {
        button = array[i];
        button.destructor();
        array.splice(i, 1);
        delete hash[button.name];
    }

    return this;
};

Buttons.prototype.on = function(name, time, frame) {
    return (this.__hash[name] || Buttons_add(this, name)).on(time, frame);
};

Buttons.prototype.off = function(name, time, frame) {
    return (this.__hash[name] || Buttons_add(this, name)).off(time, frame);
};

Buttons.prototype.allOff = function(time, frame) {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].off(time, frame);
    }

    return this;
};

function Buttons_add(_this, name) {
    var button = Button.create(name),
        array = _this.__array;

    array[array.length] = button;
    _this.__hash[name] = button;

    return button;
}

Buttons.prototype.toJSON = function(json) {

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

Buttons.prototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        button;

    array.length = 0;

    while (i++ < il) {
        button = new Button();
        button.fromJSON(jsonArray[i]);

        array[array.length] = button;
        hash[button.name] = button;
    }

    return this;
};
