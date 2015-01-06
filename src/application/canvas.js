var type = require("type"),
    environment = require("environment"),
    eventListener = require("event_listener"),
    Class = require("../base/class");


var ClassPrototype = Class.prototype,
    window = environment.window,
    document = environment.document;


var SCALE_REG = /-scale\s *=\s*[.0-9]+/g,
    CANVAS_STYLE = [
        "position: fixed;",
        "top: 50%;",
        "left: 50%;",
        "padding: 0px;",
        "margin-left: 0px;",
        "margin-top: 0px;"
    ].join("\n"),
    VIEWPORT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, VIEWPORT_SCALE;

function addMeta(id, name, content) {
    var meta = document.createElement("meta"),
        head = document.head;

    if (id) {
        meta.id = id;
    }
    if (name) {
        meta.name = name;
    }
    if (content) {
        meta.content = content;
    }

    head.insertBefore(meta, head.firstChild);
}

addMeta("viewport", "viewport", "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
addMeta("viewport-width", "viewport", "width=device-width");
addMeta("viewport-height", "viewport", "height=device-height");

VIEWPORT = document.getElementById("viewport");
VIEWPORT_WIDTH = document.getElementById("viewport-width");
VIEWPORT_HEIGHT = document.getElementById("viewport-height");
VIEWPORT_SCALE = VIEWPORT.getAttribute("content");

function windowOnResize() {
    VIEWPORT.setAttribute("content", VIEWPORT_SCALE.replace(SCALE_REG, "-scale=" + (1 / (window.devicePixelRatio || 1))));
    VIEWPORT_WIDTH.setAttribute("content", "width=" + window.innerWidth);
    VIEWPORT_HEIGHT.setAttribute("content", "height=" + window.innerHeight);
    window.scrollTo(0, 1);
}

eventListener.on(window, "resize orientationchange", windowOnResize);
windowOnResize();


module.exports = Canvas;


function Canvas() {
    Class.call(this);
}
Class.extend(Canvas);

Canvas.prototype.construct = function(options) {
    var _this = this,
        element = document.createElement("canvas");

    options = options || {};

    ClassPrototype.construct.call(this);

    element.style.cssText = CANVAS_STYLE;

    if (options.disableContextMenu === true) {
        element.oncontextmenu = function() {
            return false;
        };
    }

    document.body.appendChild(element);
    this.element = element;

    this.fullScreen = options.fullScreen ? options.fullScreen : (options.width == null && options.height == null) ? true : false;

    this.width = type.isNumber(options.width) ? options.width : window.innerWidth;
    this.height = type.isNumber(options.height) ? options.height : window.innerHeight;

    this.aspect = this.width / this.height;

    this.pixelWidth = this.width;
    this.pixelHeight = this.height;

    this.__handler = function() {
        Canvas_update(_this);
    };

    eventListener.on(window, "resize orientationchange", this.__handler);
    Canvas_update(_this);

    return this;
};

Canvas.prototype.destruct = function() {

    ClassPrototype.destruct.call(this);

    this.element = null;

    this.fullScreen = null;

    this.width = null;
    this.height = null;

    this.aspect = null;

    this.pixelWidth = null;
    this.pixelHeight = null;

    eventListener.off(window, "resize orientationchange", this.__handler);
    this.__handler = null;

    return this;
};

function Canvas_update(_this) {
    var w = window.innerWidth,
        h = window.innerHeight,
        aspect = w / h,
        element = _this.element,
        style = element.style,
        width, height;

    if (_this.fullScreen) {
        width = w;
        height = h;
        _this.aspect = aspect;
    } else {
        if (aspect > _this.aspect) {
            width = h * _this.aspect;
            height = h;
        } else {
            width = w;
            height = w / _this.aspect;
        }
    }

    _this.pixelWidth = width | 0;
    _this.pixelHeight = height | 0;

    element.width = width;
    element.height = height;

    style.marginLeft = -(((width + 1) * 0.5) | 0) + "px";
    style.marginTop = -(((height + 1) * 0.5) | 0) + "px";

    style.width = (width | 0) + "px";
    style.height = (height | 0) + "px";

    _this.emit("resize");
}
