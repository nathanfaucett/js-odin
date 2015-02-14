module.exports = Button;


function Button() {
    this.name = null;

    this.timeDown = null;
    this.timeUp = null;

    this.frameDown = null;
    this.frameUp = null;

    this.value = null;
    this.__first = null;
}

Button.create = function(name) {
    return (new Button()).construct(name);
};

Button.prototype.construct = function(name) {

    this.name = name;

    this.timeDown = -1;
    this.timeUp = -1;

    this.frameDown = -1;
    this.frameUp = -1;

    this.value = false;
    this.__first = true;

    return this;
};

Button.prototype.destructor = function() {

    this.name = null;

    this.timeDown = null;
    this.timeUp = null;

    this.frameDown = null;
    this.frameUp = null;

    this.value = null;
    this.__first = null;

    return this;
};

Button.prototype.on = function(time, frame) {

    if (this.__first) {
        this.frameDown = frame;
        this.timeDown = time;
        this.__first = false;
    }

    this.value = true;

    return this;
};

Button.prototype.off = function(time, frame) {

    this.frameUp = frame;
    this.timeUp = time;
    this.value = false;
    this.__first = true;

    return this;
};

Button.prototype.toJSON = function(json) {

    json = json || {};

    json.name = this.name;

    json.timeDown = this.timeDown;
    json.timeUp = this.timeUp;

    json.frameDown = this.frameDown;
    json.frameUp = this.frameUp;

    json.value = this.value;

    return json;
};

Button.prototype.fromJSON = function(json) {

    this.name = json.name;

    this.timeDown = json.timeDown;
    this.timeUp = json.timeUp;

    this.frameDown = json.frameDown;
    this.frameUp = json.frameUp;

    this.value = json.value;
    this.__first = true;

    return this;
};
