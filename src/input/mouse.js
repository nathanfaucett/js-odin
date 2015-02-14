var vec2 = require("vec2");


module.exports = Mouse;


function Mouse() {
    this.position = vec2.create();
    this.delta = vec2.create();
    this.wheel = null;
    this.__first = null;
}

Mouse.create = function() {
    return (new Mouse()).construct();
};

Mouse.prototype.construct = function() {

    this.wheel = 0;
    this.__first = false;

    return this;
};

Mouse.prototype.destructor = function() {

    vec2.set(this.position, 0, 0);
    vec2.set(this.delta, 0, 0);
    this.wheel = null;
    this.__first = null;

    return this;
};

Mouse.prototype.update = function(e) {
    var first = this.__first,
        position = this.position,
        delta = this.delta,

        target = e.target,
        offsetX = target.offsetLeft || 0,
        offsetY = target.offsetTop || 0,

        x = e.pageX - offsetX,
        y = e.pageY - offsetY,

        lastX = first ? position[0] : x,
        lastY = first ? position[1] : y;

    position[0] = x;
    position[1] = y;

    delta[0] = x - lastX;
    delta[1] = y - lastY;

    this.__first = true;
};
