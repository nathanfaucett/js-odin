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

    return this;
};

Handler.prototype.attach = function(element) {
    var _this, input, stack;

    if (element === this.__element) {
        return this;
    }

    _this = this;

    input = this.__input;
    stack = input.__stack;

    this.__handler = function(e) {
        var type = e.type,
            event;

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
    focusNode(element);
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
