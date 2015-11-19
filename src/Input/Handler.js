var EventEmitter = require("event_emitter"),
    focusNode = require("focus_node"),
    blurNode = require("blur_node"),
    getActiveElement = require("get_active_element"),
    eventListener = require("event_listener"),
    gamepads = require("gamepads"),
    GamepadEvent = require("./events/GamepadEvent"),
    events = require("./events");


var HandlerPrototype;


module.exports = Handler;


function Handler() {
    var _this = this;

    EventEmitter.call(this, -1);

    this.__input = null;
    this.__element = null;

    this.onEvent = function(e) {
        _this.__onEvent(e);
    };

    this.onGamepadConnect = function(e) {
        _this.__onGamepad("gamepadconnect", e);
    };
    this.onGamepadUpdate = function(e) {
        _this.__onGamepad("gamepadupdate", e);
    };
    this.onGamepadDisconnect = function(e) {
        _this.__onGamepad("gamepaddisconnect", e);
    };

    this.onFocus = function(e) {
        _this.__onFocus(e);
    };

    this.onBlur = function(e) {
        _this.__onBlur(e);
    };
}
EventEmitter.extend(Handler);
HandlerPrototype = Handler.prototype;

Handler.create = function(input) {
    return (new Handler()).construct(input);
};

HandlerPrototype.construct = function(input) {

    this.__input = input;

    return this;
};

HandlerPrototype.destructor = function() {

    this.__input = null;
    this.__element = null;

    return this;
};

HandlerPrototype.__onEvent = function(e) {
    var stack = this.__input.__stack,
        type = e.type,
        event;

    e.preventDefault();

    event = events[type].create(e);

    this.emit("event", event);
    stack[stack.length] = event;
};

HandlerPrototype.__onGamepad = function(type, e) {
    var stack = this.__input.__stack,
        event = GamepadEvent.create(type, e);

    this.emit("event", event);
    stack[stack.length] = event;
};

HandlerPrototype.__onFocus = function() {
    var element = this.__element;

    if (getActiveElement() !== element) {
        focusNode(element);
    }
};

HandlerPrototype.__onBlur = function() {
    var element = this.__element;

    if (getActiveElement() === element) {
        blurNode(element);
    }
};

HandlerPrototype.attach = function(element) {
    if (element === this.__element) {
        return this;
    } else {
        element.setAttribute("tabindex", 1);
        focusNode(element);
        eventListener.on(element, "mouseover touchstart", this.onFocus);
        eventListener.on(element, "mouseout touchcancel", this.onBlur);

        eventListener.on(
            element,
            "mousedown mouseup mousemove mouseout wheel " +
            "keydown keyup " +
            "touchstart touchmove touchend touchcancel",
            this.onEvent
        );
        eventListener.on(window, "devicemotion", this.onEvent);

        gamepads.on("connect", this.onGamepadConnect);
        gamepads.on("update", this.onGamepadUpdate);
        gamepads.on("disconnect", this.onGamepadDisconnect);

        this.__element = element;

        return this;
    }
};

HandlerPrototype.detach = function() {
    var element = this.__element;

    if (element) {
        element.removeAttribute("tabindex");
        eventListener.off(element, "mouseover touchstart", this.onFocus);
        eventListener.off(element, "mouseout touchcancel", this.onBlur);

        eventListener.off(
            element,
            "mousedown mouseup mousemove mouseout wheel " +
            "keydown keyup " +
            "touchstart touchmove touchend touchcancel",
            this.onEvent
        );
        eventListener.off(window, "devicemotion", this.onEvent);

        gamepads.off("connect", this.onGamepadConnect);
        gamepads.off("update", this.onGamepadUpdate);
        gamepads.off("disconnect", this.onGamepadDisconnect);
    }

    this.__element = null;

    return this;
};
