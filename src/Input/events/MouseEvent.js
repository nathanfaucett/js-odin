var createPool = require("create_pool"),
    environment = require("environment");


var window = environment.window,
    MouseEventPrototype;


module.exports = MouseEvent;


function MouseEvent(e) {
    var target = e.target;

    this.type = e.type;

    this.x = getMouseX(e, target);
    this.y = getMouseY(e, target);
    this.button = getButton(e);
}
createPool(MouseEvent);
MouseEventPrototype = MouseEvent.prototype;

MouseEvent.create = function(e) {
    return MouseEvent.getPooled(e);
};

MouseEventPrototype.destroy = function() {
    MouseEvent.release(this);
};

MouseEventPrototype.destructor = function() {
    this.type = null;
    this.x = null;
    this.y = null;
    this.button = null;
};

function getMouseX(e, target) {
    return e.clientX - ((target.offsetLeft || 0) - (window.pageXOffset || 0));
}

function getMouseY(e, target) {
    return e.clientY - ((target.offsetTop || 0) - (window.pageYOffset || 0));
}

function getButton(e) {
    var button = e.button;

    return (
        e.which != null ? button : (
            button === 2 ? 2 : button === 4 ? 1 : 0
        )
    );
}