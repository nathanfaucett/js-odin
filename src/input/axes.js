var Axis = require("./axis");


var AxesPrototype;


module.exports = Axes;


function Axes() {
    this.__array = [];
    this.__hash = {};
}
AxesPrototype = Axes.prototype;

Axes.create = function() {
    return (new Axes()).construct();
};

AxesPrototype.construct = function() {

    this.add({
        name: "horizontal",
        posButton: "right",
        negButton: "left",
        altPosButton: "d",
        altNegButton: "a",
        type: Axis.ButtonType
    });

    this.add({
        name: "vertical",
        posButton: "up",
        negButton: "down",
        altPosButton: "w",
        altNegButton: "s",
        type: Axis.ButtonType
    });

    this.add({
        name: "fire",
        posButton: "ctrl",
        negButton: "",
        altPosButton: "mouse0",
        altNegButton: "",
        type: Axis.ButtonType
    });

    this.add({
        name: "jump",
        posButton: "space",
        negButton: "",
        altPosButton: "mouse2",
        altNegButton: "",
        type: Axis.ButtonType
    });

    this.add({
        name: "mouseX",
        type: Axis.MouseType,
        axis: 0
    });

    this.add({
        name: "mouseY",
        type: Axis.MouseType,
        axis: 1
    });

    this.add({
        name: "touchX",
        type: Axis.TouchType,
        axis: 0
    });

    this.add({
        name: "touchY",
        type: Axis.TouchType,
        axis: 1
    });

    this.add({
        name: "mouseWheel",
        type: Axis.WheelType
    });

    return this;
};

AxesPrototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = array.length,
        axis;

    while (i--) {
        axis = array[i];
        axis.destructor();
        array.splice(i, 1);
        delete hash[axis.name];
    }

    return this;
};

AxesPrototype.add = function(options) {
    var hash = this.__hash,
        array = this.__array,
        instance;

    options = options || {};

    if (hash[name]) {
        throw new Error(
            'Axes add(): Axes already have Axis named ' + name + ' use Axes.get("' + name + '") and edit it instead'
        );
    }

    instance = Axis.create(
        options.name,
        options.negButton, options.posButton,
        options.altNegButton, options.altPosButton,
        options.gravity, options.sensitivity, options.dead, options.type, options.axis, options.index, options.joyNum
    );

    array[array.length] = instance;
    hash[instance.name] = instance;

    return instance;
};

AxesPrototype.get = function(name) {
    return this.__hash[name];
};

AxesPrototype.update = function(input, dt) {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].update(input, dt);
    }

    return this;
};

AxesPrototype.toJSON = function(json) {

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

AxesPrototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        axis;

    array.length = 0;

    while (i++ < il) {
        axis = new Axis();
        axis.fromJSON(jsonArray[i]);

        array[array.length] = axis;
        hash[axis.name] = axis;
    }

    return this;
};
