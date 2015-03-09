var vec3 = require("vec3"),
    EventEmitter = require("event_emitter"),
    Handler = require("./handler"),
    Mouse = require("./mouse"),
    Buttons = require("./buttons"),
    Touches = require("./touches"),
    Axes = require("./axes"),
    eventHandlers = require("./event_handlers");


var mouseButtons = [
    "mouse0",
    "mouse1",
    "mouse2"
];


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

Input.create = function() {
    return (new Input()).construct();
};

Input.prototype.construct = function() {

    this.mouse.construct();
    this.buttons.construct();
    this.touches.construct();
    this.axes.construct();

    return this;
};

Input.prototype.destructor = function() {

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

Input.prototype.attach = function(element) {
    var handler = this.__handler;

    if (!handler) {
        handler = this.__handler = Handler.create(this);
    } else {
        handler.detach(element);
    }

    handler.attach(element);

    return this;
};

Input.prototype.server = function(socket) {
    var stack = this.__stack;

    socket.on("inputevent", function(e) {
        stack[stack.length] = e;
    });

    return this;
};

Input.prototype.client = function(socket) {
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

Input.prototype.axis = function(name) {
    var axis = this.axes.__hash[name];
    return axis ? axis.value : 0;
};

Input.prototype.touch = function(index) {
    return this.touches.__array[index];
};

Input.prototype.mouseButton = function(id) {
    var button = this.buttons.__hash[mouseButtons[id]];

    return button && button.value;
};


Input.prototype.mouseButtonDown = function(id) {
    var button = this.buttons.__hash[mouseButtons[id]];

    return !!button && button.value && (button.frameDown >= this.__frame);
};


Input.prototype.mouseButtonUp = function(id) {
    var button = this.buttons.__hash[mouseButtons[id]];

    return button != null ? (button.frameUp >= this.__frame) : true;
};

Input.prototype.key = function(name) {
    var button = this.buttons.__hash[name];

    return !!button && button.value;
};

Input.prototype.keyDown = function(name) {
    var button = this.buttons.__hash[name];

    return !!button && button.value && (button.frameDown >= this.__frame);
};

Input.prototype.keyUp = function(name) {
    var button = this.buttons.__hash[name];

    return button != null ? (button.frameUp >= this.__frame) : true;
};

Input.prototype.update = function(time, frame) {
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

    if (this.__handler) {
        this.__handler.reset();
    }

    return this;
};
