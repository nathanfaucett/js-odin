var vec2 = require("vec2");


module.exports = Touch;


function Touch() {
    this.id = null;
    this.index = null;

    this.radiusX = null;
    this.radiusY = null;
    this.rotationAngle = null;
    this.force = null;

    this.delta = vec2.create();
    this.position = vec2.create();

    this.__first = null;
}

Touch.create = function() {
    return (new Touch()).construct();
};

Touch.prototype.construct = function() {

    this.id = -1;
    this.index = -1;

    this.radiusX = 0;
    this.radiusY = 0;
    this.rotationAngle = 0;
    this.force = 1;

    this.__first = false;

    return this;
};

Touch.prototype.destructor = function() {

    this.id = null;
    this.index = null;

    this.radiusX = null;
    this.radiusY = null;
    this.rotationAngle = null;
    this.force = null;

    vec2.set(this.delta, 0, 0);
    vec2.set(this.position, 0, 0);

    this.__first = null;

    return this;
};

Touch.prototype.update = function(e) {
    var position = this.position,
        delta = this.delta,
        first = this.__first,

        x = e.x,
        y = e.y,

        lastX = first ? position[0] : x,
        lastY = first ? position[1] : y;

    position[0] = x;
    position[1] = y;

    delta[0] = x - lastX;
    delta[1] = y - lastY;

    this.radiusX = e.radiusX;
    this.radiusY = e.radiusY;
    this.rotationAngle = e.rotationAngle;
    this.force = e.force;

    this.__first = true;

    return this;
};

Touch.prototype.toJSON = function(json) {
    json = json || {};

    json.id = this.id;
    json.index = this.index;

    json.radiusX = this.radiusX;
    json.radiusY = this.radiusY;
    json.rotationAngle = this.rotationAngle;
    json.force = this.force;

    json.delta = vec2.copy(json.delta || [], this.delta);
    json.position = vec2.copy(json.position || [], this.position);

    return json;
};


Touch.prototype.fromJSON = function(json) {

    this.id = json.id;
    this.index = json.index;

    this.radiusX = json.radiusX;
    this.radiusY = json.radiusY;
    this.rotationAngle = json.rotationAngle;
    this.force = json.force;

    vec2.copy(this.delta, json.delta);
    vec2.copy(this.position, json.position);

    return this;
};
