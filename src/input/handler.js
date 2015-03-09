var EventEmitter = require("event_emitter"),
    focusNode = require("focus_node"),
    blurNode = require("blur_node"),
    getActiveElement = require("get_active_element"),
    eventListener = require("event_listener"),
    events = require("./events");


module.exports = Handler;


function Handler() {

    EventEmitter.call(this, -1);

    this.__input = null;
    this.__element = null;

    this.__handler = null;

    this.__focusHandler = null;
    this.__blurHandler = null;

    this.__handled = {
        mousedown: false,
        mouseup: false,
        mousemove: false,
        mouseout: false,
        wheel: false,
        keyup: false,
        keydown: false,
        touchstart: false,
        touchmove: false,
        touchend: false,
        touchcancel: false,
        devicemotion: false
    };
}
EventEmitter.extend(Handler);

Handler.create = function(input) {
    return (new Handler()).construct(input);
};

Handler.prototype.construct = function(input) {

    this.__input = input;

    return this;
};

Handler.prototype.destructor = function() {

    this.__input = null;
    this.__element = null;

    this.__handler = null;

    this.__focusHandler = null;
    this.__blurHandler = null;

    this.reset();

    return this;
};

Handler.prototype.reset = function() {
    var handled = this.__handled;

    handled.mousedown = false;
    handled.mouseup = false;
    handled.mousemove = false;
    handled.mouseout = false;
    handled.wheel = false;
    handled.keyup = false;
    handled.keydown = false;
    handled.touchstart = false;
    handled.touchmove = false;
    handled.touchend = false;
    handled.touchcancel = false;
    handled.devicemotion = false;

    return this;
};

Handler.prototype.attach = function(element) {
    var _this, input, stack, handled;

    if (element === this.__element) {
        return this;
    }

    _this = this;

    input = this.__input;
    stack = input.__stack;

    handled = this.__handled;

    this.__handler = function(e) {
        var type = e.type,
            event;

        if (handled[type]) {
            return;
        }

        handled[type] = true;

        e.preventDefault();

        event = events[type].create(e);

        _this.emit("event", event);
        stack[stack.length] = event;
    };

    this.__focusHandler = function() {
        if (getActiveElement() !== element) {
            focusNode(element);
        }
    };

    this.__blurHandler = function() {
        if (getActiveElement() === element) {
            blurNode(element);
        }
    };

    element.setAttribute("tabindex", 1);
    eventListener.on(element, "mouseover touchstart", this.__focusHandler);
    eventListener.on(element, "mouseout touchcancel", this.__blurHandler);

    eventListener.on(
        element,
        "mousedown mouseup mousemove mouseout wheel " +
        "keydown keyup " +
        "touchstart touchmove touchend touchcancel",
        this.__handler
    );
    eventListener.on(window, "devicemotion", this.__handler);

    this.__element = element;

    return this;
};

Handler.prototype.detach = function() {
    var element = this.__element;

    if (element) {
        element.removeAttribute("tabindex");
        eventListener.off(element, "mouseover touchstart", this.__focusHandler);
        eventListener.off(element, "mouseout touchcancel", this.__blurHandler);

        eventListener.off(
            element,
            "mousedown mouseup mousemove mouseout wheel " +
            "keydown keyup " +
            "touchstart touchmove touchend touchcancel",
            this.__handler
        );
        eventListener.off(window, "devicemotion", this.__handler);
    }

    this.__element = null;
    this.__handler = null;
    this.__nativeHandler = null;

    return this;
};
