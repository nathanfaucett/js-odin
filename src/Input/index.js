var vec3 = require("vec3"),
    EventEmitter = require("event_emitter"),
    Handler = require("./Handler"),
    Mouse = require("./Mouse"),
    Buttons = require("./Buttons"),
    Touches = require("./Touches"),
    Axes = require("./Axes"),
    eventHandlers = require("./eventHandlers");


var MOUSE_BUTTONS = [
        "mouse0",
        "mouse1",
        "mouse2"
    ],
    InputPrototype;


module.exports = Input;


function Input() {

    EventEmitter.call(this, -1);

    this.__lastTime = null;
    this.__frame = null;

    this.__stack = [];
    this.__handler = null;

    this.mouse = new Mouse();
    this.buttons = new Buttons();
    this.touches = new Touches();
    this.axes = new Axes();
    this.acceleration = vec3.create();
}
EventEmitter.extend(Input);
InputPrototype = Input.prototype;

Input.create = function() {
    return (new Input()).construct();
};

InputPrototype.construct = function() {

    this.mouse.construct();
    this.buttons.construct();
    this.touches.construct();
    this.axes.construct();

    return this;
};

InputPrototype.destructor = function() {

    this.__lastTime = null;
    this.__frame = null;

    this.__stack.length = 0;
    this.__handler = null;

    this.mouse.destructor();
    this.buttons.destructor();
    this.touches.destructor();
    this.axes.destructor();
    vec3.set(this.acceleration, 0, 0, 0);

    return this;
};

InputPrototype.attach = function(element) {
    var handler = this.__handler;

    if (!handler) {
        handler = this.__handler = Handler.create(this);
    } else {
        handler.detach(element);
    }

    handler.attach(element);

    return this;
};

InputPrototype.server = function(socket) {
    var stack = this.__stack;

    socket.on("inputevent", function(e) {
        stack[stack.length] = e;
    });

    return this;
};

InputPrototype.client = function(socket) {
    var handler = this.__handler,
        send = createSendFn(socket);

    handler.on("event", function(e) {
        send("inputevent", e);
    });

    return this;
};

function createSendFn(socket) {
    if (socket.emit) {
        return function send(type, data) {
            return socket.emit(type, data);
        };
    } else {
        return function send(type, data) {
            return socket.send(type, data);
        };
    }
}

InputPrototype.axis = function(name) {
    var axis = this.axes.__hash[name];
    return axis ? axis.value : 0;
};

InputPrototype.touch = function(index) {
    return this.touches.__array[index];
};

InputPrototype.mouseButton = function(id) {
    var button = this.buttons.__hash[MOUSE_BUTTONS[id]];
    return button && button.value;
};


InputPrototype.mouseButtonDown = function(id) {
    var button = this.buttons.__hash[MOUSE_BUTTONS[id]];
    return !!button && button.value && (button.frameDown >= this.__frame);
};


InputPrototype.mouseButtonUp = function(id) {
    var button = this.buttons.__hash[MOUSE_BUTTONS[id]];
    return button != null ? (button.frameUp >= this.__frame) : true;
};

InputPrototype.key = function(name) {
    var button = this.buttons.__hash[name];
    return !!button && button.value;
};

InputPrototype.keyDown = function(name) {
    var button = this.buttons.__hash[name];
    return !!button && button.value && (button.frameDown >= this.__frame);
};

InputPrototype.keyUp = function(name) {
    var button = this.buttons.__hash[name];
    return button != null ? (button.frameUp >= this.__frame) : true;
};

InputPrototype.update = function(time, frame) {
    var stack = this.__stack,
        i = -1,
        il = stack.length - 1,
        event, lastTime;

    this.__frame = frame;
    this.mouse.wheel = 0;

    while (i++ < il) {
        event = stack[i];

        eventHandlers[event.type](this, event, time, frame);

        if (event.destroy) {
            event.destroy();
        }
    }

    stack.length = 0;

    lastTime = this.__lastTime || (this.__lastTime = time);
    this.__lastTime = time;

    this.axes.update(this, time - lastTime);
    this.emit("update");

    return this;
};
