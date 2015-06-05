(function(dependencies, undefined, global) {
    var cache = [];

    function require(index) {
        var module = cache[index],
            callback, exports;

        if (module !== undefined) {
            return module.exports;
        } else {
            callback = dependencies[index];
            exports = {};

            cache[index] = module = {
                exports: exports,
                require: require
            };

            callback.call(exports, require, exports, module, global);
            return module.exports;
        }
    }

    require.resolve = function(path) {
        return path;
    };

    if (typeof(define) === "function" && define.amd) {
        define([], function() {
            return require(0);
        });
    } else if (typeof(module) !== "undefined" && module.exports) {
        module.exports = require(0);
    } else {
        
        require(0);
        
    }
}([
function(require, exports, module, global) {

var environment = require(1),
    eventListener = require(2),
    odin = require(8);


eventListener.on(environment.window, "load", function onLoad() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false
        }),
        renderer = odin.Renderer.create();

    var shader = odin.Shader.create([
            "void main(void) {",
            "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
            "}"
        ].join("\n"), [
            "uniform vec3 color;",

            "void main(void) {",
            "    gl_FragColor = vec4(color, 1.0);",
            "}"
        ].join("\n")
    );

    var material = global.material = odin.Material.create("mat_box", null, {
        shader: shader,
        uniforms: {
            color: [0.0, 0.0, 0.5]
        }
    });

    assets.addAsset(material);

    var camera = odin.Entity.create("main_camera").addComponent(
        odin.Transform.create()
            .setPosition([-5, -5, 5]),
        odin.Camera.create()
            .setOrthographic(false)
            .setActive(),
        odin.OrbitControl.create()
    );

    var sprite = global.object = odin.Entity.create().addComponent(
        odin.Transform2D.create(),
        odin.Sprite.create({
            x: 0,
            y: 0,
            w: 1,
            h: 0.5,
            material: material
        })
    );

    var scene = global.scene = odin.Scene.create("scene").addEntity(camera, sprite),
        cameraComponent = camera.getComponent("odin.Camera");

    scene.assets = assets;

    canvas.on("resize", function(w, h) {
        cameraComponent.set(w, h);
    });
    cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

    renderer.setCanvas(canvas.element);

    var loop = odin.createLoop(function() {
        scene.update();
        renderer.render(scene, cameraComponent);
    }, canvas.element);

    assets.load(function() {
        scene.init(canvas.element);
        scene.awake();
        loop.run();
    });
});


},
function(require, exports, module, global) {

var environment = exports,

    hasWindow = typeof(window) !== "undefined",
    userAgent = hasWindow ? window.navigator.userAgent : "";


environment.worker = typeof(importScripts) !== "undefined";

environment.browser = environment.worker || !!(
    hasWindow &&
    typeof(navigator) !== "undefined" &&
    window.document
);

environment.node = !environment.worker && !environment.browser;

environment.mobile = environment.browser && /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

environment.window = (
    hasWindow ? window :
    typeof(global) !== "undefined" ? global :
    typeof(self) !== "undefined" ? self : {}
);

environment.pixelRatio = environment.window.devicePixelRatio || 1;

environment.document = typeof(document) !== "undefined" ? document : {};


},
function(require, exports, module, global) {

var process = require(3);
var isObject = require(4),
    isFunction = require(5),
    environment = require(1),
    eventTable = require(6);


var eventListener = module.exports,

    reSpliter = /[\s]+/,

    window = environment.window,
    document = environment.document,

    listenToEvent, captureEvent, removeEvent, dispatchEvent;


window.Event = window.Event || function EmptyEvent() {};


eventListener.on = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        listenToEvent(target, eventTypes[i], callback);
    }
};

eventListener.capture = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        captureEvent(target, eventTypes[i], callback);
    }
};

eventListener.off = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        removeEvent(target, eventTypes[i], callback);
    }
};

eventListener.emit = function(target, eventType, event) {

    return dispatchEvent(target, eventType, isObject(event) ? event : {});
};

eventListener.getEventConstructor = function(target, eventType) {
    var getter = eventTable[eventType];
    return isFunction(getter) ? getter(target) : window.Event;
};


if (isFunction(document.addEventListener)) {

    listenToEvent = function(target, eventType, callback) {

        target.addEventListener(eventType, callback, false);
    };

    captureEvent = function(target, eventType, callback) {

        target.addEventListener(eventType, callback, true);
    };

    removeEvent = function(target, eventType, callback) {

        target.removeEventListener(eventType, callback, false);
    };

    dispatchEvent = function(target, eventType, event) {
        var getter = eventTable[eventType],
            EventType = isFunction(getter) ? getter(target) : window.Event;

        return !!target.dispatchEvent(new EventType(eventType, event));
    };
} else if (isFunction(document.attachEvent)) {

    listenToEvent = function(target, eventType, callback) {

        target.attachEvent("on" + eventType, callback);
    };

    captureEvent = function() {
        if (process.env.NODE_ENV === "development") {
            throw new Error(
                "Attempted to listen to events during the capture phase on a " +
                "browser that does not support the capture phase. Your application " +
                "will not receive some events."
            );
        }
    };

    removeEvent = function(target, eventType, callback) {

        target.detachEvent("on" + eventType, callback);
    };

    dispatchEvent = function(target, eventType, event) {
        var doc = target.ownerDocument || document;

        return !!target.fireEvent("on" + eventType, doc.createEventObject(event));
    };
} else {

    listenToEvent = function(target, eventType, callback) {

        target["on" + eventType] = callback;
        return target;
    };

    captureEvent = function() {
        if (process.env.NODE_ENV === "development") {
            throw new Error(
                "Attempted to listen to events during the capture phase on a " +
                "browser that does not support the capture phase. Your application " +
                "will not receive some events."
            );
        }
    };

    removeEvent = function(target, eventType) {

        target["on" + eventType] = null;
        return true;
    };

    dispatchEvent = function(target, eventType, event) {
        var onType = "on" + eventType;

        if (isFunction(target[onType])) {
            event.type = eventType;
            return !!target[onType](event);
        }

        return false;
    };
}


},
function(require, exports, module, global) {

// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};


},
function(require, exports, module, global) {

module.exports = isObject;


function isObject(obj) {
    var type = typeof(obj);
    return type === "function" || (obj && type === "object") || false;
}


},
function(require, exports, module, global) {

var objectToString = Object.prototype.toString,
    isFunction;


if (typeof(/./) === "function" || (typeof(Uint8Array) !== "undefined" && typeof(Uint8Array) !== "function")) {
    isFunction = function isFunction(obj) {
        return objectToString.call(obj) === "[object Function]";
    };
} else {
    isFunction = function isFunction(obj) {
        return typeof(obj) === "function" || false;
    };
}


module.exports = isFunction;


},
function(require, exports, module, global) {

var isNode = require(7),
    environment = require(1);


var window = environment.window,

    XMLHttpRequest = window.XMLHttpRequest,
    OfflineAudioContext = window.OfflineAudioContext;


function returnEvent() {
    return window.Event;
}


module.exports = {
    abort: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else {
            return window.UIEvent || window.Event;
        }
    },

    afterprint: returnEvent,

    animationend: function() {
        return window.AnimationEvent || window.Event;
    },
    animationiteration: function() {
        return window.AnimationEvent || window.Event;
    },
    animationstart: function() {
        return window.AnimationEvent || window.Event;
    },

    audioprocess: function() {
        return window.AudioProcessingEvent || window.Event;
    },

    beforeprint: returnEvent,
    beforeunload: function() {
        return window.BeforeUnloadEvent || window.Event;
    },
    beginevent: function() {
        return window.TimeEvent || window.Event;
    },

    blocked: returnEvent,
    blur: function() {
        return window.FocusEvent || window.Event;
    },

    cached: returnEvent,
    canplay: returnEvent,
    canplaythrough: returnEvent,
    chargingchange: returnEvent,
    chargingtimechange: returnEvent,
    checking: returnEvent,

    click: function() {
        return window.MouseEvent || window.Event;
    },

    close: returnEvent,
    compassneedscalibration: function() {
        return window.SensorEvent || window.Event;
    },
    complete: function(target) {
        if (OfflineAudioContext && target instanceof OfflineAudioContext) {
            return window.OfflineAudioCompletionEvent || window.Event;
        } else {
            return window.Event;
        }
    },

    compositionend: function() {
        return window.CompositionEvent || window.Event;
    },
    compositionstart: function() {
        return window.CompositionEvent || window.Event;
    },
    compositionupdate: function() {
        return window.CompositionEvent || window.Event;
    },

    contextmenu: function() {
        return window.MouseEvent || window.Event;
    },
    copy: function() {
        return window.ClipboardEvent || window.Event;
    },
    cut: function() {
        return window.ClipboardEvent || window.Event;
    },

    dblclick: function() {
        return window.MouseEvent || window.Event;
    },
    devicelight: function() {
        return window.DeviceLightEvent || window.Event;
    },
    devicemotion: function() {
        return window.DeviceMotionEvent || window.Event;
    },
    deviceorientation: function() {
        return window.DeviceOrientationEvent || window.Event;
    },
    deviceproximity: function() {
        return window.DeviceProximityEvent || window.Event;
    },

    dischargingtimechange: returnEvent,

    DOMActivate: function() {
        return window.UIEvent || window.Event;
    },
    DOMAttributeNameChanged: function() {
        return window.MutationNameEvent || window.Event;
    },
    DOMAttrModified: function() {
        return window.MutationEvent || window.Event;
    },
    DOMCharacterDataModified: function() {
        return window.MutationEvent || window.Event;
    },
    DOMContentLoaded: returnEvent,
    DOMElementNameChanged: function() {
        return window.MutationNameEvent || window.Event;
    },
    DOMFocusIn: function() {
        return window.FocusEvent || window.Event;
    },
    DOMFocusOut: function() {
        return window.FocusEvent || window.Event;
    },
    DOMNodeInserted: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeInsertedIntoDocument: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeRemoved: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeRemovedFromDocument: function() {
        return window.MutationEvent || window.Event;
    },
    DOMSubtreeModified: function() {
        return window.FocusEvent || window.Event;
    },
    downloading: returnEvent,

    drag: function() {
        return window.DragEvent || window.Event;
    },
    dragend: function() {
        return window.DragEvent || window.Event;
    },
    dragenter: function() {
        return window.DragEvent || window.Event;
    },
    dragleave: function() {
        return window.DragEvent || window.Event;
    },
    dragover: function() {
        return window.DragEvent || window.Event;
    },
    dragstart: function() {
        return window.DragEvent || window.Event;
    },
    drop: function() {
        return window.DragEvent || window.Event;
    },

    durationchange: returnEvent,
    ended: returnEvent,

    endEvent: function() {
        return window.TimeEvent || window.Event;
    },
    error: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else if (isNode(target)) {
            return window.UIEvent || window.Event;
        } else {
            return window.Event;
        }
    },
    focus: function() {
        return window.FocusEvent || window.Event;
    },
    focusin: function() {
        return window.FocusEvent || window.Event;
    },
    focusout: function() {
        return window.FocusEvent || window.Event;
    },

    fullscreenchange: returnEvent,
    fullscreenerror: returnEvent,

    gamepadconnected: function() {
        return window.GamepadEvent || window.Event;
    },
    gamepaddisconnected: function() {
        return window.GamepadEvent || window.Event;
    },

    hashchange: function() {
        return window.HashChangeEvent || window.Event;
    },

    input: returnEvent,
    invalid: returnEvent,

    keydown: function() {
        return window.KeyboardEvent || window.Event;
    },
    keyup: function() {
        return window.KeyboardEvent || window.Event;
    },
    keypress: function() {
        return window.KeyboardEvent || window.Event;
    },

    languagechange: returnEvent,
    levelchange: returnEvent,

    load: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else {
            return window.UIEvent || window.Event;
        }
    },

    loadeddata: returnEvent,
    loadedmetadata: returnEvent,

    loadend: function() {
        return window.ProgressEvent || window.Event;
    },
    loadstart: function() {
        return window.ProgressEvent || window.Event;
    },

    message: function() {
        return window.MessageEvent || window.Event;
    },

    mousedown: function() {
        return window.MouseEvent || window.Event;
    },
    mouseenter: function() {
        return window.MouseEvent || window.Event;
    },
    mouseleave: function() {
        return window.MouseEvent || window.Event;
    },
    mousemove: function() {
        return window.MouseEvent || window.Event;
    },
    mouseout: function() {
        return window.MouseEvent || window.Event;
    },
    mouseover: function() {
        return window.MouseEvent || window.Event;
    },
    mouseup: function() {
        return window.MouseEvent || window.Event;
    },

    noupdate: returnEvent,
    obsolete: returnEvent,
    offline: returnEvent,
    online: returnEvent,
    open: returnEvent,
    orientationchange: returnEvent,

    pagehide: function() {
        return window.PageTransitionEvent || window.Event;
    },
    pageshow: function() {
        return window.PageTransitionEvent || window.Event;
    },

    paste: function() {
        return window.ClipboardEvent || window.Event;
    },
    pause: returnEvent,
    pointerlockchange: returnEvent,
    pointerlockerror: returnEvent,
    play: returnEvent,
    playing: returnEvent,

    popstate: function() {
        return window.PopStateEvent || window.Event;
    },
    progress: function() {
        return window.ProgressEvent || window.Event;
    },

    ratechange: returnEvent,
    readystatechange: returnEvent,

    repeatevent: function() {
        return window.TimeEvent || window.Event;
    },

    reset: returnEvent,

    resize: function() {
        return window.UIEvent || window.Event;
    },
    scroll: function() {
        return window.UIEvent || window.Event;
    },

    seeked: returnEvent,
    seeking: returnEvent,

    select: function() {
        return window.UIEvent || window.Event;
    },
    show: function() {
        return window.MouseEvent || window.Event;
    },
    stalled: returnEvent,
    storage: function() {
        return window.StorageEvent || window.Event;
    },
    submit: returnEvent,
    success: returnEvent,
    suspend: returnEvent,

    SVGAbort: function() {
        return window.SVGEvent || window.Event;
    },
    SVGError: function() {
        return window.SVGEvent || window.Event;
    },
    SVGLoad: function() {
        return window.SVGEvent || window.Event;
    },
    SVGResize: function() {
        return window.SVGEvent || window.Event;
    },
    SVGScroll: function() {
        return window.SVGEvent || window.Event;
    },
    SVGUnload: function() {
        return window.SVGEvent || window.Event;
    },
    SVGZoom: function() {
        return window.SVGEvent || window.Event;
    },
    timeout: function() {
        return window.ProgressEvent || window.Event;
    },

    timeupdate: returnEvent,

    touchcancel: function() {
        return window.TouchEvent || window.Event;
    },
    touchend: function() {
        return window.TouchEvent || window.Event;
    },
    touchenter: function() {
        return window.TouchEvent || window.Event;
    },
    touchleave: function() {
        return window.TouchEvent || window.Event;
    },
    touchmove: function() {
        return window.TouchEvent || window.Event;
    },
    touchstart: function() {
        return window.TouchEvent || window.Event;
    },

    transitionend: function() {
        return window.TransitionEvent || window.Event;
    },
    unload: function() {
        return window.UIEvent || window.Event;
    },

    updateready: returnEvent,
    upgradeneeded: returnEvent,

    userproximity: function() {
        return window.SensorEvent || window.Event;
    },

    visibilitychange: returnEvent,
    volumechange: returnEvent,
    waiting: returnEvent,

    wheel: function() {
        return window.WheelEvent || window.Event;
    }
};


},
function(require, exports, module, global) {

var isFunction = require(5);


var isNode;


if (typeof(Node) !== "undefined" && isFunction(Node)) {
    isNode = function isNode(obj) {
        return obj instanceof Node;
    };
} else {
    isNode = function isNode(obj) {
        return (
            typeof(obj) === "object" &&
            typeof(obj.nodeType) === "number" &&
            typeof(obj.nodeName) === "string"
        );
    };
}


module.exports = isNode;


},
function(require, exports, module, global) {

var odin = exports;


odin.Class = require(9);
odin.createLoop = require(26);

odin.enums = require(30);

odin.BaseApplication = require(91);
odin.Application = require(118);

odin.Assets = require(92);
odin.Asset = require(119);
odin.ImageAsset = require(120);
odin.JSONAsset = require(123);
odin.Texture = require(139);
odin.Material = require(140);
odin.Geometry = require(146);

odin.Canvas = require(151);
odin.Renderer = require(152);
odin.ComponentRenderer = require(154);

odin.Shader = require(141);

odin.Scene = require(93);
odin.Plugin = require(158);
odin.Entity = require(117);

odin.ComponentManager = require(159);

odin.Component = require(160);

odin.Transform = require(161);
odin.Transform2D = require(163);
odin.Camera = require(166);

odin.Sprite = require(168);

odin.Mesh = require(170);
odin.MeshAnimation = require(174);

odin.OrbitControl = require(175);

odin.ParticleSystem = require(176);


},
function(require, exports, module, global) {

var has = require(10),
    isFunction = require(5),
    inherits = require(11),
    EventEmitter = require(23),
    uuid = require(25);


var ClassPrototype;


module.exports = Class;


function Class() {

    EventEmitter.call(this, -1);

    this.__id = null;
}
EventEmitter.extend(Class);
ClassPrototype = Class.prototype;

Class.extend = function(child, className) {
    if (has(Class.__classes, className)) {
        throw new Error("extend(Child, className) class named " + className + " already defined");
    }

    Class.__classes[className] = child;

    inherits(child, this);
    child.className = child.prototype.className = className;

    if (isFunction(this.onExtend)) {
        this.onExtend.apply(this, arguments);
    }

    return child;
};

Class.__classes = {};

Class.getClass = function(className) {
    return Class.__classes[className];
};

Class.createFromJSON = function(json) {
    return Class.getClass(json.className).create().fromJSON(json);
};

Class.className = ClassPrototype.className = "Class";

Class.create = function() {
    var instance = new this();
    return instance.construct.apply(instance, arguments);
};

ClassPrototype.construct = function() {

    this.__id = uuid();

    return this;
};

ClassPrototype.destructor = function() {

    this.__id = null;

    return this;
};

ClassPrototype.toJSON = function(json) {
    json = json || {};

    json.className = this.className;

    return json;
};

ClassPrototype.fromJSON = function( /* json */ ) {
    return this;
};


},
function(require, exports, module, global) {

var hasOwnProp = Object.prototype.hasOwnProperty;


module.exports = has;


function has(obj, key) {
    return hasOwnProp.call(obj, key);
}


},
function(require, exports, module, global) {

var create = require(12),
    extend = require(13),
    mixin = require(20),
    defineProperty = require(21);


var descriptor = {
    configurable: true,
    enumerable: false,
    writable: true,
    value: null
};


module.exports = inherits;


function inherits(child, parent) {

    mixin(child, parent);

    child.prototype = extend(create(parent.prototype), child.prototype);

    defineNonEnumerableProperty(child, "__super", parent.prototype);
    defineNonEnumerableProperty(child.prototype, "constructor", child);

    child.defineStatic = defineStatic;
    child.super_ = parent; // support node

    return child;
}
inherits.defineProperty = defineNonEnumerableProperty;

function defineNonEnumerableProperty(object, name, value) {
    descriptor.value = value;
    defineProperty(object, name, descriptor);
    descriptor.value = null;
}

function defineStatic(name, value) {
    defineNonEnumerableProperty(this, name, value);
}


},
function(require, exports, module, global) {

var create, F;


if (Object.create) {
    create = Object.create;
} else {
    F = function F() {};
    create = function create(object) {
        F.prototype = object;
        return new F();
    };
}


module.exports = create;


},
function(require, exports, module, global) {

var keys = require(14);


module.exports = extend;


function extend(out) {
    var i = 0,
        il = arguments.length - 1;

    while (i++ < il) {
        baseExtend(out, arguments[i]);
    }

    return out;
}

function baseExtend(a, b) {
    var objectKeys = keys(b),
        i = -1,
        il = objectKeys.length - 1,
        key;

    while (i++ < il) {
        key = objectKeys[i];
        a[key] = b[key];
    }
}


},
function(require, exports, module, global) {

var has = require(10),
    isNative = require(15),
    isObject = require(4);


var nativeKeys = Object.keys;


module.exports = keys;


function keys(obj) {
    return nativeKeys(isObject(obj) ? obj : Object(obj));
}

if (!isNative(nativeKeys)) {
    nativeKeys = function keys(obj) {
        var localHas = has,
            out = [],
            i = 0,
            key;

        for (key in obj) {
            if (localHas(obj, key)) {
                out[i++] = key;
            }
        }

        return out;
    };
}


},
function(require, exports, module, global) {

var isFunction = require(5),
    escapeRegExp = require(16);


var reHostCtor = /^\[object .+?Constructor\]$/,

    functionToString = Function.prototype.toString,

    reNative = RegExp("^" +
        escapeRegExp(Object.prototype.toString)
        .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ),

    isHostObject;


try {
    String({
        "toString": 0
    } + "");
} catch (e) {
    isHostObject = function isHostObject() {
        return false;
    };
}

isHostObject = function isHostObject(value) {
    return !isFunction(value.toString) && typeof(value + "") === "string";
};


module.exports = isNative;


function isNative(obj) {
    return obj && (
        isFunction(obj) ?
        reNative.test(functionToString.call(obj)) : (
            typeof(obj) === "object" && (
                (isHostObject(obj) ? reNative : reHostCtor).test(obj) || false
            )
        )
    ) || false;
}


},
function(require, exports, module, global) {

var toString = require(17);


var reRegExpChars = /[.*+?\^${}()|\[\]\/\\]/g,
    reHasRegExpChars = new RegExp(reRegExpChars.source);


module.exports = escapeRegExp;


function escapeRegExp(string) {
    string = toString(string);
    return (
        (string && reHasRegExpChars.test(string)) ?
        string.replace(reRegExpChars, "\\$&") :
        string
    );
}


},
function(require, exports, module, global) {

var isString = require(18),
    isNullOrUndefined = require(19);


module.exports = toString;


function toString(value) {
    if (isString(value)) {
        return value;
    } else if (isNullOrUndefined(value)) {
        return "";
    } else {
        return value + "";
    }
}


},
function(require, exports, module, global) {

module.exports = isString;


function isString(obj) {
    return typeof(obj) === "string" || false;
}


},
function(require, exports, module, global) {

module.exports = isNullOrUndefined;

/**
  isNullOrUndefined accepts any value and returns true
  if the value is null or undefined. For all other values
  false is returned.
  
  @param {Any}        any value to test
  @returns {Boolean}  the boolean result of testing value

  @example
    isNullOrUndefined(null);   // returns true
    isNullOrUndefined(undefined);   // returns true
    isNullOrUndefined("string");    // returns false
**/
function isNullOrUndefined(obj) {

    return (obj === null || obj === void 0);

}


},
function(require, exports, module, global) {

var keys = require(14),
    isNullOrUndefined = require(19);


module.exports = mixin;


function mixin(out) {
    var i = 0,
        il = arguments.length - 1;

    while (i++ < il) {
        baseMixin(out, arguments[i]);
    }

    return out;
}

function baseMixin(a, b) {
    var objectKeys = keys(b),
        i = -1,
        il = objectKeys.length - 1,
        key, value;

    while (i++ < il) {
        key = objectKeys[i];

        if (isNullOrUndefined(a[key]) && !isNullOrUndefined((value = b[key]))) {
            a[key] = value;
        }
    }
}


},
function(require, exports, module, global) {

var isFunction = require(5),
    isObjectLike = require(22),
    isNative = require(15);


var defineProperty;


if (!isNative(Object.defineProperty)) {
    defineProperty = function defineProperty(object, name, value) {
        if (!isObjectLike(object)) {
            throw new TypeError("defineProperty called on non-object");
        }
        object[name] = isObjectLike(value) ? (isFunction(value.get) ? value.get : value.value) : value;
    };
} else {
    defineProperty = Object.defineProperty;
}


module.exports = defineProperty;


},
function(require, exports, module, global) {

module.exports = isObjectLike;


function isObjectLike(obj) {
    return (obj && typeof(obj) === "object") || false;
}


},
function(require, exports, module, global) {

var isFunction = require(5),
    inherits = require(11),
    fastSlice = require(24),
    keys = require(14);


function EventEmitter(maxListeners) {
    this.__events = {};
    this.__maxListeners = maxListeners != null ? maxListeners : EventEmitter.defaultMaxListeners;
}

EventEmitter.prototype.on = function(name, listener) {
    var events, eventList, maxListeners;

    if (!isFunction(listener)) {
        throw new TypeError("EventEmitter.on(name, listener) listener must be a function");
    }

    events = this.__events || (this.__events = {});
    eventList = (events[name] || (events[name] = []));
    maxListeners = this.__maxListeners || -1;

    eventList[eventList.length] = listener;

    if (maxListeners !== -1 && eventList.length > maxListeners) {
        console.error(
            "EventEmitter.on(type, listener) possible EventEmitter memory leak detected. " + maxListeners + " listeners added"
        );
    }

    return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function(name, listener) {
    var _this = this;

    function once() {

        _this.off(name, once);

        switch (arguments.length) {
            case 0:
                return listener();
            case 1:
                return listener(arguments[0]);
            case 2:
                return listener(arguments[0], arguments[1]);
            case 3:
                return listener(arguments[0], arguments[1], arguments[2]);
            case 4:
                return listener(arguments[0], arguments[1], arguments[2], arguments[3]);
            default:
                return listener.apply(null, arguments);
        }
    }

    this.on(name, once);

    return once;
};

EventEmitter.prototype.listenTo = function(obj, name) {
    var _this = this;

    if (!obj || !(isFunction(obj.on) || isFunction(obj.addListener))) {
        throw new TypeError("EventEmitter.listenTo(obj, name) obj must have a on function taking (name, listener[, ctx])");
    }

    function handler() {
        _this.emitArgs(name, arguments);
    }

    obj.on(name, handler);

    return handler;
};

EventEmitter.prototype.off = function(name, listener) {
    var events = this.__events || (this.__events = {}),
        eventList, event, i;

    eventList = events[name];
    if (!eventList) {
        return this;
    }

    if (!listener) {
        i = eventList.length;

        while (i--) {
            this.emit("removeListener", name, eventList[i]);
        }
        eventList.length = 0;
        delete events[name];
    } else {
        i = eventList.length;

        while (i--) {
            event = eventList[i];

            if (event === listener) {
                this.emit("removeListener", name, event);
                eventList.splice(i, 1);
            }
        }

        if (eventList.length === 0) {
            delete events[name];
        }
    }

    return this;
};

EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

EventEmitter.prototype.removeAllListeners = function() {
    var events = this.__events || (this.__events = {}),
        objectKeys = keys(events),
        i = -1,
        il = objectKeys.length - 1,
        key, eventList, j;

    while (i++ < il) {
        key = objectKeys[i];
        eventList = events[key];

        if (eventList) {
            j = eventList.length;

            while (j--) {
                this.emit("removeListener", key, eventList[j]);
                eventList.splice(j, 1);
            }
        }

        delete events[key];
    }

    return this;
};

function emit(eventList, args) {
    var a1, a2, a3, a4, a5,
        length = eventList.length - 1,
        i = -1,
        event;

    switch (args.length) {
        case 0:
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event();
                }
            }
            break;
        case 1:
            a1 = args[0];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1);
                }
            }
            break;
        case 2:
            a1 = args[0];
            a2 = args[1];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2);
                }
            }
            break;
        case 3:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3);
                }
            }
            break;
        case 4:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            a4 = args[3];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3, a4);
                }
            }
            break;
        case 5:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            a4 = args[3];
            a5 = args[4];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3, a4, a5);
                }
            }
            break;
        default:
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event.apply(null, args);
                }
            }
            break;
    }
}

EventEmitter.prototype.emitArgs = function(name, args) {
    var eventList = (this.__events || (this.__events = {}))[name];

    if (!eventList || !eventList.length) {
        return this;
    }

    emit(eventList, args);

    return this;
};

EventEmitter.prototype.emit = function(name) {
    return this.emitArgs(name, fastSlice(arguments, 1));
};

function createFunctionCaller(args) {
    switch (args.length) {
        case 0:
            return function functionCaller(fn) {
                return fn();
            };
        case 1:
            return function functionCaller(fn) {
                return fn(args[0]);
            };
        case 2:
            return function functionCaller(fn) {
                return fn(args[0], args[1]);
            };
        case 3:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2]);
            };
        case 4:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2], args[3]);
            };
        case 5:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2], args[3], args[4]);
            };
        default:
            return function functionCaller(fn) {
                return fn.apply(null, args);
            };
    }
}

function emitAsync(eventList, args, callback) {
    var length = eventList.length,
        index = 0,
        called = false,
        functionCaller;

    function next(err) {
        if (called !== true) {
            if (err || index === length) {
                called = true;
                callback(err);
            } else {
                functionCaller(eventList[index++]);
            }
        }
    }

    args[args.length] = next;
    functionCaller = createFunctionCaller(args);
    next();
}

EventEmitter.prototype.emitAsync = function(name, args, callback) {
    var eventList = (this.__events || (this.__events = {}))[name];

    args = fastSlice(arguments, 1);
    callback = args.pop();

    if (!isFunction(callback)) {
        throw new TypeError("EventEmitter.emitAsync(name [, ...args], callback) callback must be a function");
    }

    if (!eventList || !eventList.length) {
        callback();
    } else {
        emitAsync(eventList, args, callback);
    }

    return this;
};

EventEmitter.prototype.listeners = function(name) {
    var eventList = (this.__events || (this.__events = {}))[name];

    return eventList ? eventList.slice() : [];
};

EventEmitter.prototype.listenerCount = function(name) {
    var eventList = (this.__events || (this.__events = {}))[name];

    return eventList ? eventList.length : 0;
};

EventEmitter.prototype.setMaxListeners = function(value) {
    if ((value = +value) !== value) {
        throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
    }

    this.__maxListeners = value < 0 ? -1 : value;
    return this;
};


inherits.defineProperty(EventEmitter, "defaultMaxListeners", 10);


inherits.defineProperty(EventEmitter, "listeners", function(obj, name) {
    var eventList;

    if (obj == null) {
        throw new TypeError("EventEmitter.listeners(obj, name) obj required");
    }
    eventList = obj.__events && obj.__events[name];

    return eventList ? eventList.slice() : [];
});

inherits.defineProperty(EventEmitter, "listenerCount", function(obj, name) {
    var eventList;

    if (obj == null) {
        throw new TypeError("EventEmitter.listenerCount(obj, name) obj required");
    }
    eventList = obj.__events && obj.__events[name];

    return eventList ? eventList.length : 0;
});

inherits.defineProperty(EventEmitter, "setMaxListeners", function(value) {
    if ((value = +value) !== value) {
        throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
    }

    EventEmitter.defaultMaxListeners = value < 0 ? -1 : value;
    return value;
});

EventEmitter.extend = function(child) {
    inherits(child, this);
    return child;
};


module.exports = EventEmitter;


},
function(require, exports, module, global) {

module.exports = fastSlice;


function fastSlice(array, offset) {
    var length, i, il, result, j;

    offset = offset || 0;

    length = array.length;
    i = offset - 1;
    il = length - 1;
    result = new Array(length - offset);
    j = 0;

    while (i++ < il) {
        result[j++] = array[i];
    }

    return result;
}


},
function(require, exports, module, global) {

var CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
    UUID = new Array(36);


module.exports = uuid;


function uuid() {
    var i = -1;

    while (i++ < 36) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            UUID[i] = "-";
        } else if (i === 14) {
            UUID[i] = "4";
        } else {
            UUID[i] = CHARS[(Math.random() * 62) | 0];
        }
    }

    return UUID.join("");
}


},
function(require, exports, module, global) {

var requestAnimationFrame = require(27);


module.exports = function createLoop(callback, element) {
    var id = null,
        running = false;

    function request() {
        id = requestAnimationFrame(run, element);
    }

    function run(ms) {

        callback(ms);

        if (running) {
            request();
        }
    }

    return {
        run: function() {
            if (running === false) {
                running = true;
                request();
            }
        },
        pause: function() {
            running = false;

            if (id) {
                requestAnimationFrame.cancel(id);
            }
        },
        setCallback: function(value) {
            callback = value;
        },
        setElement: function(value) {
            element = value;
        },
        isRunning: function() {
            return running;
        },
        isPaused: function() {
            return !running;
        }
    };
};


},
function(require, exports, module, global) {

var environment = require(1),
    emptyFunction = require(28),
    time = require(29);


var window = environment.window,

    nativeRequestAnimationFrame = (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame
    ),

    nativeCancelAnimationFrame = (
        window.cancelAnimationFrame ||
        window.cancelRequestAnimationFrame ||

        window.webkitCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||

        window.mozCancelAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||

        window.oCancelAnimationFrame ||
        window.oCancelRequestAnimationFrame ||

        window.msCancelAnimationFrame ||
        window.msCancelRequestAnimationFrame
    ),

    requestAnimationFrame, lastTime, max;


if (nativeRequestAnimationFrame) {
    requestAnimationFrame = function requestAnimationFrame(callback, element) {
        return nativeRequestAnimationFrame.call(window, callback, element);
    };
} else {
    max = Math.max;
    lastTime = 0;

    requestAnimationFrame = function requestAnimationFrame(callback) {
        var current = time.now(),
            timeToCall = max(0, 16 - (current - lastTime)),
            id = global.setTimeout(
                function runCallback() {
                    callback(current + timeToCall);
                },
                timeToCall
            );

        lastTime = current + timeToCall;
        return id;
    };
}


if (nativeCancelAnimationFrame && nativeRequestAnimationFrame) {
    requestAnimationFrame.cancel = function(id) {
        return nativeCancelAnimationFrame.call(window, id);
    };
} else {
    requestAnimationFrame.cancel = function(id) {
        return global.clearTimeout(id);
    };
}


requestAnimationFrame(emptyFunction);


module.exports = requestAnimationFrame;


},
function(require, exports, module, global) {

module.exports = emptyFunction;


function emptyFunction() {}

function makeEmptyFunction(value) {
    return function() {
        return value;
    };
}

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function() {
    return this;
};
emptyFunction.thatReturnsArgument = function(argument) {
    return argument;
};


},
function(require, exports, module, global) {

var process = require(3);
var environment = require(1);


var time = exports,
    dateNow, performance, HR_TIME, START_MS, now;


dateNow = Date.now || function now() {
    return (new Date()).getTime();
};


if (!environment.node) {
    performance = environment.window.performance || {};

    performance.now = (
        performance.now ||
        performance.webkitNow ||
        performance.mozNow ||
        performance.msNow ||
        performance.oNow ||
        function now() {
            return dateNow() - START_MS;
        }
    );

    now = function now() {
        return performance.now();
    };
} else {
    HR_TIME = process.hrtime();

    now = function now() {
        var hrtime = process.hrtime(HR_TIME),
            ms = hrtime[0] * 1e3,
            ns = hrtime[1] * 1e-6;

        return ms + ns;
    };
}

START_MS = dateNow();

time.now = now;

time.stamp = function stamp() {
    return START_MS + now();
};


},
function(require, exports, module, global) {

var extend = require(13),
    WebGLContext = require(31);


var enums = extend(exports, WebGLContext.enums);


enums.side = require(89);
enums.wrapMode = require(90);


},
function(require, exports, module, global) {

var mathf = require(32),

    environment = require(1),
    EventEmitter = require(23),
    eventListener = require(2),
    color = require(35),

    enums = require(37),
    WebGLBuffer = require(52),
    WebGLTexture = require(53),
    WebGLProgram = require(55);


var NativeUint8Array = typeof(Uint8Array) !== "undefined" ? Uint8Array : Array,
    cullFace = enums.cullFace,
    blending = enums.blending,
    depth = enums.depth,
    WebGLContextPrototype;


module.exports = WebGLContext;


WebGLContext.enums = enums;
WebGLContext.WebGLTexture = WebGLTexture;
WebGLContext.WebGLProgram = WebGLProgram;


function WebGLContext() {

    EventEmitter.call(this);

    this.gl = null;
    this.canvas = null;

    this.__attributes = {};

    this.__textures = {};

    this.__precision = null;
    this.__extensions = {};

    this.__maxAnisotropy = null;
    this.__maxTextures = null;
    this.__maxVertexTextures = null;
    this.__maxTextureSize = null;
    this.__maxCubeTextureSize = null;
    this.__maxRenderBufferSize = null;

    this.__maxUniforms = null;
    this.__maxVaryings = null;
    this.__maxAttributes = null;

    this.__enabledAttributes = null;

    this.__viewportX = null;
    this.__viewportY = null;
    this.__viewportWidth = null;
    this.__viewportHeight = null;

    this.__clearColor = color.create();
    this.__clearAlpha = null;

    this.__blending = null;
    this.__blendingDisabled = null;
    this.__cullFace = null;
    this.__cullFaceDisabled = null;
    this.__depthFunc = null;
    this.__depthTestDisabled = null;
    this.__depthWrite = null;
    this.__lineWidth = null;

    this.__program = null;
    this.__programForce = null;

    this.__textureIndex = null;
    this.__activeIndex = null;
    this.__activeTexture = null;

    this.__arrayBuffer = null;
    this.__elementArrayBuffer = null;

    this.__handlerContextLost = null;
    this.__handlerContextRestored = null;
}
EventEmitter.extend(WebGLContext);
WebGLContextPrototype = WebGLContext.prototype;

WebGLContextPrototype.setAttributes = function(attributes) {

    getAttributes(this.__attributes, attributes);

    if (this.gl) {
        WebGLContext_getGLContext(this);
    }

    return this;
};

WebGLContextPrototype.setCanvas = function(canvas, attributes) {
    var _this = this,
        thisCanvas = this.canvas;

    if (thisCanvas) {
        if (thisCanvas !== canvas) {
            eventListener.off(thisCanvas, "webglcontextlost", this.__handlerContextLost);
            eventListener.off(thisCanvas, "webglcontextrestored", this.__handlerContextRestored);
        } else {
            return this;
        }
    }

    getAttributes(this.__attributes, attributes);
    this.canvas = canvas;

    this.__handlerContextLost = this.__handlerContextLost || function handlerContextLost(e) {
        handleWebGLContextContextLost(_this, e);
    };
    this.__handlerContextRestored = this.__handlerContextRestored || function handlerContextRestored(e) {
        handleWebGLContextContextRestored(_this, e);
    };

    eventListener.on(canvas, "webglcontextlost", this.__handlerContextLost);
    eventListener.on(canvas, "webglcontextrestored", this.__handlerContextRestored);

    WebGLContext_getGLContext(this);

    return this;
};

WebGLContextPrototype.clearGL = function() {

    this.gl = null;

    this.__textures = {};

    this.__precision = null;
    this.__extensions = {};

    this.__maxAnisotropy = null;
    this.__maxTextures = null;
    this.__maxVertexTextures = null;
    this.__maxTextureSize = null;
    this.__maxCubeTextureSize = null;
    this.__maxRenderBufferSize = null;

    this.__maxUniforms = null;
    this.__maxVaryings = null;
    this.__maxAttributes = null;

    this.__enabledAttributes = null;

    this.__viewportX = null;
    this.__viewportY = null;
    this.__viewportWidth = null;
    this.__viewportHeight = null;

    color.set(this.__clearColor, 0, 0, 0);
    this.__clearAlpha = null;

    this.__blending = null;
    this.__blendingDisabled = true;
    this.__cullFace = null;
    this.__cullFaceDisabled = true;
    this.__depthFunc = null;
    this.__depthTestDisabled = true;
    this.__depthWrite = null;
    this.__lineWidth = null;

    this.__program = null;
    this.__programForce = null;

    this.__textureIndex = null;
    this.__activeIndex = null;
    this.__activeTexture = null;

    this.__arrayBuffer = null;
    this.__elementArrayBuffer = null;

    return this;
};

WebGLContextPrototype.resetGL = function() {

    this.__textures = {};

    this.__viewportX = null;
    this.__viewportY = null;
    this.__viewportWidth = null;
    this.__viewportHeight = null;

    this.__clearAlpha = null;

    this.__blending = null;
    this.__blendingDisabled = true;
    this.__cullFace = null;
    this.__cullFaceDisabled = true;
    this.__depthFunc = null;
    this.__depthTestDisabled = true;
    this.__depthWrite = null;
    this.__lineWidth = null;

    this.__program = null;
    this.__programForce = null;

    this.__textureIndex = null;
    this.__activeIndex = null;
    this.__activeTexture = null;

    this.__arrayBuffer = null;
    this.__elementArrayBuffer = null;

    this.disableAttributes();
    this.setViewport(0, 0, 1, 1);
    this.setDepthWrite(true);
    this.setLineWidth(1);
    this.setDepthFunc(depth.LESS);
    this.setCullFace(cullFace.BACK);
    this.setBlending(blending.DEFAULT);
    this.setClearColor(color.set(this.__clearColor, 0, 0, 0), 1);
    this.setProgram(null);
    this.clearCanvas();

    return this;
};

WebGLContextPrototype.clampMaxSize = function(image, isCubeMap) {
    var maxSize = isCubeMap ? this.__maxCubeTextureSize : this.__maxTextureSize,
        maxDim, newWidth, newHeight, canvas, ctx;

    if (!image || (image.height <= maxSize && image.width <= maxSize)) {
        return image;
    } else {
        maxDim = 1 / mathf.max(image.width, image.height);
        newWidth = (image.width * maxSize * maxDim) | 0;
        newHeight = (image.height * maxSize * maxDim) | 0;
        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight);

        return canvas;
    }
};

WebGLContextPrototype.setProgram = function(program, force) {
    if (this.__program !== program || force) {
        this.__program = program;
        this.__programForce = true;

        if (program) {
            this.gl.useProgram(program.glProgram);
        } else {
            this.gl.useProgram(null);
        }
    } else {
        if (this.__textureIndex !== 0 || this.__activeIndex !== -1) {
            this.__programForce = true;
        } else {
            this.__programForce = false;
        }
    }

    this.__textureIndex = 0;
    this.__activeIndex = -1;

    return this;
};

WebGLContextPrototype.setTexture = function(location, texture, force) {
    var gl = this.gl,
        webglTexture = this.createTexture(texture),
        index = this.__textureIndex++,
        needsUpdate = this.__activeIndex !== index;

    this.__activeIndex = index;

    if (this.__activeTexture !== webglTexture || force) {
        this.__activeTexture = webglTexture;

        if (webglTexture.isCubeMap) {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, webglTexture.getGLTexture());
        } else {
            gl.bindTexture(gl.TEXTURE_2D, webglTexture.getGLTexture());
        }

        if (needsUpdate || this.__programForce || force) {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.uniform1i(location, index);
        }

        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.setArrayBuffer = function(buffer, force) {
    var gl = this.gl;

    if (this.__arrayBuffer !== buffer || force) {
        this.disableAttributes();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
        this.__arrayBuffer = buffer;
        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.setElementArrayBuffer = function(buffer, force) {
    var gl = this.gl;

    if (this.__elementArrayBuffer !== buffer || force) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.glBuffer);
        this.__elementArrayBuffer = buffer;
        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.setAttribPointer = function(location, itemSize, type, stride, offset, force) {
    var gl = this.gl;

    if (this.enableAttribute(location) || force) {
        gl.vertexAttribPointer(location, itemSize, type, gl.FALSE, stride, offset);
        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.createProgram = function() {
    return new WebGLProgram(this);
};

WebGLContextPrototype.createTexture = function(texture) {
    var textures = this.__textures;
    return textures[texture.__id] || (textures[texture.__id] = new WebGLTexture(this, texture));
};

WebGLContextPrototype.createBuffer = function() {
    return new WebGLBuffer(this);
};

WebGLContextPrototype.deleteProgram = function(program) {
    this.gl.deleteProgram(program.glProgram);
    return this;
};

WebGLContextPrototype.deleteTexture = function(texture) {
    this.gl.deleteTexture(texture.glTexture);
    return this;
};

WebGLContextPrototype.deleteBuffer = function(buffer) {
    this.gl.deleteBuffer(buffer.glBuffer);
    return this;
};

WebGLContextPrototype.setViewport = function(x, y, width, height) {
    x = x || 0;
    y = y || 0;
    width = width || 1;
    height = height || 1;

    if (
        this.__viewportX !== x ||
        this.__viewportY !== y ||
        this.__viewportWidth !== width ||
        this.__viewportHeight !== height
    ) {
        this.__viewportX = x;
        this.__viewportY = y;
        this.__viewportWidth = width;
        this.__viewportHeight = height;

        this.gl.viewport(x, y, width, height);
    }

    return this;
};

WebGLContextPrototype.setDepthWrite = function(depthWrite) {

    if (this.__depthWrite !== depthWrite) {
        this.__depthWrite = depthWrite;
        this.gl.depthMask(depthWrite);
    }

    return this;
};

WebGLContextPrototype.setLineWidth = function(width) {

    if (this.__lineWidth !== width) {
        this.__lineWidth = width;
        this.gl.lineWidth(width);
    }

    return this;
};

WebGLContextPrototype.setDepthFunc = function(depthFunc) {
    var gl = this.gl;

    if (this.__depthFunc !== depthFunc) {
        switch (depthFunc) {
            case depth.NEVER:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.NEVER);
                break;
            case depth.LESS:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.LESS);
                break;
            case depth.EQUAL:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.EQUAL);
                break;
            case depth.LEQUAL:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.LEQUAL);
                break;
            case depth.GREATER:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.GREATER);
                break;
            case depth.NOTEQUAL:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.NOTEQUAL);
                break;
            case depth.GEQUAL:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.GEQUAL);
                break;
            case depth.ALWAYS:
                if (this.__depthTestDisabled) {
                    gl.enable(gl.DEPTH_TEST);
                }
                gl.depthFunc(gl.ALWAYS);
                break;
            default:
                this.__depthTestDisabled = true;
                this.__depthFunc = depth.NONE;
                gl.disable(gl.DEPTH_TEST);
                return this;
        }

        this.__depthTestDisabled = false;
        this.__depthFunc = depthFunc;
    }

    return this;
};

WebGLContextPrototype.setCullFace = function(value) {
    var gl = this.gl;

    if (this.__cullFace !== value) {
        switch (value) {
            case cullFace.BACK:
                if (this.__cullFaceDisabled) {
                    gl.enable(gl.CULL_FACE);
                }
                gl.cullFace(gl.BACK);
                break;
            case cullFace.FRONT:
                if (this.__cullFaceDisabled) {
                    gl.enable(gl.CULL_FACE);
                }
                gl.cullFace(gl.FRONT);
                break;
            case cullFace.FRONT_AND_BACK:
                if (this.__cullFaceDisabled) {
                    gl.enable(gl.CULL_FACE);
                }
                gl.cullFace(gl.FRONT_AND_BACK);
                break;
            default:
                this.__cullFaceDisabled = true;
                this.__cullFace = cullFace.NONE;
                gl.disable(gl.CULL_FACE);
                return this;
        }

        this.__cullFaceDisabled = false;
        this.__cullFace = value;
    }

    return this;
};

WebGLContextPrototype.setBlending = function(value) {
    var gl = this.gl;

    if (this.__blending !== value) {
        switch (value) {
            case blending.ADDITIVE:
                if (this.__blendingDisabled) {
                    gl.enable(gl.BLEND);
                }
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            case blending.SUBTRACTIVE:
                if (this.__blendingDisabled) {
                    gl.enable(gl.BLEND);
                }
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
                break;
            case blending.MULTIPLY:
                if (this.__blendingDisabled) {
                    gl.enable(gl.BLEND);
                }
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
                break;
            case blending.DEFAULT:
                if (this.__blendingDisabled) {
                    gl.enable(gl.BLEND);
                }
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;
            default:
                gl.disable(gl.BLEND);
                this.__blendingDisabled = true;
                this.__blending = blending.NONE;
                return this;
        }

        this.__blendingDisabled = false;
        this.__blending = value;
    }

    return this;
};

WebGLContextPrototype.setClearColor = function(clearColor, alpha) {
    alpha = alpha || 1;

    if (color.notEqual(this.__clearColor, clearColor) || alpha !== this.__clearAlpha) {

        color.copy(this.__clearColor, clearColor);
        this.__clearAlpha = alpha;

        this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], alpha);
    }

    return this;
};

WebGLContextPrototype.scissor = function(x, y, width, height) {
    this.gl.scissor(x, y, width, height);
    return this;
};

WebGLContextPrototype.clearCanvas = function(color, depth, stencil) {
    var gl = this.gl,
        bits = 0;

    if (color !== false) {
        bits |= gl.COLOR_BUFFER_BIT;
    }
    if (depth !== false) {
        bits |= gl.DEPTH_BUFFER_BIT;
    }
    if (stencil !== false) {
        bits |= gl.STENCIL_BUFFER_BIT;
    }

    gl.clear(bits);

    return this;
};

WebGLContextPrototype.clearColor = function() {
    var gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);
    return this;
};

WebGLContextPrototype.clearDepth = function() {
    var gl = this.gl;

    gl.clear(gl.DEPTH_BUFFER_BIT);
    return this;
};

WebGLContextPrototype.clearStencil = function() {
    var gl = this.gl;

    gl.clear(gl.STENCIL_BUFFER_BIT);
    return this;
};

WebGLContextPrototype.enableAttribute = function(attribute) {
    var enabledAttributes = this.__enabledAttributes;

    if (enabledAttributes[attribute] === 0) {
        this.gl.enableVertexAttribArray(attribute);
        enabledAttributes[attribute] = 1;
        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.disableAttribute = function(attribute) {
    var enabledAttributes = this.__enabledAttributes;

    if (enabledAttributes[attribute] === 1) {
        this.gl.disableVertexAttribArray(attribute);
        enabledAttributes[attribute] = 0;
        return true;
    } else {
        return false;
    }
};

WebGLContextPrototype.disableAttributes = function() {
    var gl = this.gl,
        i = this.__maxAttributes,
        enabledAttributes = this.__enabledAttributes;

    while (i--) {
        if (enabledAttributes[i] === 1) {
            gl.disableVertexAttribArray(i);
            enabledAttributes[i] = 0;
        }
    }

    return this;
};

var getExtension_lowerPrefixes = ["webkit", "moz", "o", "ms"],
    getExtension_upperPrefixes = ["WEBKIT", "MOZ", "O", "MS"];

WebGLContextPrototype.getExtension = function(name, throwError) {
    var gl = this.gl,
        extensions = this.__extensions || (this.__extensions = {}),
        extension = extensions[name] || (extensions[name] = gl.getExtension(name)),
        i;

    if (extension == null) {
        i = getExtension_upperPrefixes.length;

        while (i--) {
            if ((extension = gl.getExtension(getExtension_upperPrefixes[i] + "_" + name))) {
                extensions[name] = extension;
                break;
            }
        }
    }
    if (extension == null) {
        i = getExtension_lowerPrefixes.length;

        while (i--) {
            if ((extension = gl.getExtension(getExtension_lowerPrefixes[i] + name))) {
                extensions[name] = extension;
                break;
            }
        }
    }

    if (extension == null) {
        if (throwError) {
            throw new Error("WebGLContext.getExtension: could not get Extension " + name);
        } else {
            return null;
        }
    } else {
        return extension;
    }
};


function getAttributes(attributes, options) {
    options = options || {};

    attributes.alpha = options.alpha != null ? !!options.alpha : true;
    attributes.antialias = options.antialias != null ? !!options.antialias : true;
    attributes.depth = options.depth != null ? !!options.depth : true;
    attributes.premultipliedAlpha = options.premultipliedAlpha != null ? !!options.premultipliedAlpha : true;
    attributes.preserveDrawingBuffer = options.preserveDrawingBuffer != null ? !!options.preserveDrawingBuffer : false;
    attributes.stencil = options.stencil != null ? !!options.stencil : true;

    return attributes;
}

function handleWebGLContextContextLost(_this, e) {
    e.preventDefault();
    _this.clearGL();
    _this.emit("webglcontextlost", e);
}

function handleWebGLContextContextRestored(_this, e) {
    e.preventDefault();
    WebGLContext_getGLContext(_this);
    _this.emit("webglcontextrestored", e);
}

function WebGLContext_getGLContext(_this) {
    var gl;

    if (_this.gl != null) {
        _this.clearGL();
    }

    gl = getWebGLContext(_this.canvas, _this.__attributes);

    if (gl == null) {
        _this.emit("webglcontextcreationfailed");
    } else {
        _this.emit("webglcontextcreation");

        if (!gl.getShaderPrecisionFormat) {
            gl.getShaderPrecisionFormat = getShaderPrecisionFormat;
        }

        _this.gl = gl;
        getGPUInfo(_this);
        _this.resetGL();
    }
}

function getShaderPrecisionFormat() {
    return {
        rangeMin: 1,
        rangeMax: 1,
        precision: 1
    };
}

function getGPUInfo(_this) {
    var gl = _this.gl,

        VERTEX_SHADER = gl.VERTEX_SHADER,
        FRAGMENT_SHADER = gl.FRAGMENT_SHADER,
        HIGH_FLOAT = gl.HIGH_FLOAT,
        MEDIUM_FLOAT = gl.MEDIUM_FLOAT,

        EXT_tfa = _this.getExtension("EXT_texture_filter_anisotropic"),

        vsHighpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT),
        vsMediumpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, MEDIUM_FLOAT),

        fsHighpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT),
        fsMediumpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, MEDIUM_FLOAT),

        highpAvailable = vsHighpFloat.precision > 0 && fsHighpFloat.precision > 0,
        mediumpAvailable = vsMediumpFloat.precision > 0 && fsMediumpFloat.precision > 0,

        precision = "highp";

    if (!highpAvailable || environment.mobile) {
        if (mediumpAvailable) {
            precision = "mediump";
        } else {
            precision = "lowp";
        }
    }

    _this.__precision = precision;
    _this.__maxAnisotropy = EXT_tfa ? gl.getParameter(EXT_tfa.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    _this.__maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    _this.__maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    _this.__maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    _this.__maxCubeTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    _this.__maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

    _this.__maxUniforms = mathf.max(
        gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS), gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
    ) * 4;
    _this.__maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS) * 4;
    _this.__maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

    _this.__enabledAttributes = new NativeUint8Array(_this.__maxAttributes);
}

var getWebGLContext_webglNames = ["3d", "moz-webgl", "experimental-webgl", "webkit-3d", "webgl"],
    getWebGLContext_attuibutes = {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true
    };

function getWebGLContext(canvas, attributes) {
    var i = getWebGLContext_webglNames.length,
        gl, key;

    attributes = attributes || {};

    for (key in getWebGLContext_attuibutes) {
        if (attributes[key] == null) {
            attributes[key] = getWebGLContext_attuibutes[key];
        }
    }

    while (i--) {
        try {
            gl = canvas.getContext(getWebGLContext_webglNames[i], attributes);
            if (gl) {
                return gl;
            }
        } catch (e) {}
    }
    if (!gl) {
        throw new Error("WebGLContext: could not get a WebGL Context");
    }

    return gl;
}


},
function(require, exports, module, global) {

var keys = require(14),
    isNaN = require(33);


var mathf = exports,

    NativeMath = Math,

    NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


mathf.ArrayType = NativeFloat32Array;

mathf.PI = NativeMath.PI;
mathf.TAU = mathf.PI * 2;
mathf.TWO_PI = mathf.TAU;
mathf.HALF_PI = mathf.PI * 0.5;
mathf.FOURTH_PI = mathf.PI * 0.25;

mathf.EPSILON = Number.EPSILON || NativeMath.pow(2, -52);

mathf.TO_RADS = mathf.PI / 180;
mathf.TO_DEGS = 180 / mathf.PI;

mathf.E = NativeMath.E;
mathf.LN2 = NativeMath.LN2;
mathf.LN10 = NativeMath.LN10;
mathf.LOG2E = NativeMath.LOG2E;
mathf.LOG10E = NativeMath.LOG10E;
mathf.SQRT1_2 = NativeMath.SQRT1_2;
mathf.SQRT2 = NativeMath.SQRT2;

mathf.abs = NativeMath.abs;

mathf.acos = NativeMath.acos;
mathf.acosh = NativeMath.acosh || (NativeMath.acosh = function acosh(x) {
    return mathf.log(x + mathf.sqrt(x * x - 1));
});
mathf.asin = NativeMath.asin;
mathf.asinh = NativeMath.asinh || (NativeMath.asinh = function asinh(x) {
    if (x === -Infinity) {
        return x;
    } else {
        return mathf.log(x + mathf.sqrt(x * x + 1));
    }
});
mathf.atan = NativeMath.atan;
mathf.atan2 = NativeMath.atan2;
mathf.atanh = NativeMath.atanh || (NativeMath.atanh = function atanh(x) {
    return mathf.log((1 + x) / (1 - x)) / 2;
});

mathf.cbrt = NativeMath.cbrt || (NativeMath.cbrt = function cbrt(x) {
    var y = mathf.pow(mathf.abs(x), 1 / 3);
    return x < 0 ? -y : y;
});

mathf.ceil = NativeMath.ceil;

mathf.clz32 = NativeMath.clz32 || (NativeMath.clz32 = function clz32(value) {
    value = +value >>> 0;
    return value ? 32 - value.toString(2).length : 32;
});

mathf.cos = NativeMath.cos;
mathf.cosh = NativeMath.cosh || (NativeMath.cosh = function cosh(x) {
    return (mathf.exp(x) + mathf.exp(-x)) / 2;
});

mathf.exp = NativeMath.exp;

mathf.expm1 = NativeMath.expm1 || (NativeMath.expm1 = function expm1(x) {
    return mathf.exp(x) - 1;
});

mathf.floor = NativeMath.floor;
mathf.fround = NativeMath.fround || (NativeMath.fround = function fround(x) {
    return new NativeFloat32Array([x])[0];
});

mathf.hypot = NativeMath.hypot || (NativeMath.hypot = function hypot() {
    var y = 0,
        i = -1,
        il = arguments.length - 1,
        value;

    while (i++ < il) {
        value = arguments[i];

        if (value === Infinity || value === -Infinity) {
            return Infinity;
        } else {
            y += value * value;
        }
    }

    return mathf.sqrt(y);
});

mathf.imul = NativeMath.imul || (NativeMath.imul = function imul(a, b) {
    var ah = (a >>> 16) & 0xffff,
        al = a & 0xffff,
        bh = (b >>> 16) & 0xffff,
        bl = b & 0xffff;

    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
});

mathf.log = NativeMath.log;

mathf.log1p = NativeMath.log1p || (NativeMath.log1p = function log1p(x) {
    return mathf.log(1 + x);
});

mathf.log10 = NativeMath.log10 || (NativeMath.log10 = function log10(x) {
    return mathf.log(x) / mathf.LN10;
});

mathf.log2 = NativeMath.log2 || (NativeMath.log2 = function log2(x) {
    return mathf.log(x) / mathf.LN2;
});

mathf.max = NativeMath.max;
mathf.min = NativeMath.min;

mathf.pow = NativeMath.pow;

mathf.random = NativeMath.random;
mathf.round = NativeMath.round;

mathf.sign = NativeMath.sign || (NativeMath.sign = function sign(x) {
    x = +x;
    if (x === 0 || isNaN(x)) {
        return x;
    } else {
        return x > 0 ? 1 : -1;
    }
});

mathf.sin = NativeMath.sin;
mathf.sinh = NativeMath.sinh || (NativeMath.sinh = function sinh(x) {
    return (mathf.exp(x) - mathf.exp(-x)) / 2;
});
mathf.sqrt = NativeMath.sqrt;

mathf.tan = NativeMath.tan;
mathf.tanh = NativeMath.tanh || (NativeMath.tanh = function tanh(x) {
    if (x === Infinity) {
        return 1;
    } else if (x === -Infinity) {
        return -1;
    } else {
        return (mathf.exp(x) - mathf.exp(-x)) / (mathf.exp(x) + mathf.exp(-x));
    }
});

mathf.trunc = NativeMath.trunc || (NativeMath.trunc = function trunc(x) {
    return x < 0 ? mathf.ceil(x) : mathf.floor(x);
});

mathf.equals = function(a, b, e) {
    return mathf.abs(a - b) < (e !== void 0 ? e : mathf.EPSILON);
};

mathf.modulo = function(a, b) {
    var r = a % b;

    return (r * b < 0) ? r + b : r;
};

mathf.standardRadian = function(x) {
    return mathf.modulo(x, mathf.TWO_PI);
};

mathf.standardAngle = function(x) {
    return mathf.modulo(x, 360);
};

mathf.snap = function(x, y) {
    var m = x % y;
    return m < (y * 0.5) ? x - m : x + y - m;
};

mathf.clamp = function(x, min, max) {
    return x < min ? min : x > max ? max : x;
};

mathf.clampBottom = function(x, min) {
    return x < min ? min : x;
};

mathf.clampTop = function(x, max) {
    return x > max ? max : x;
};

mathf.clamp01 = function(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
};

mathf.truncate = function(x, n) {
    var p = mathf.pow(10, n),
        num = x * p;

    return (num < 0 ? mathf.ceil(num) : mathf.floor(num)) / p;
};

mathf.lerp = function(a, b, x) {
    return a + (b - a) * x;
};

mathf.lerpRadian = function(a, b, x) {
    return mathf.standardRadian(a + (b - a) * x);
};

mathf.lerpAngle = function(a, b, x) {
    return mathf.standardAngle(a + (b - a) * x);
};

mathf.lerpCos = function(a, b, x) {
    var ft = x * mathf.PI,
        f = (1 - mathf.cos(ft)) * 0.5;

    return a * (1 - f) + b * f;
};

mathf.lerpCubic = function(v0, v1, v2, v3, x) {
    var P, Q, R, S, Px, Qx, Rx;

    v0 = v0 || v1;
    v3 = v3 || v2;

    P = (v3 - v2) - (v0 - v1);
    Q = (v0 - v1) - P;
    R = v2 - v0;
    S = v1;

    Px = P * x;
    Qx = Q * x;
    Rx = R * x;

    return (Px * Px * Px) + (Qx * Qx) + Rx + S;
};

mathf.smoothStep = function(x, min, max) {
    if (x <= min) {
        return 0;
    } else {
        if (x >= max) {
            return 1;
        } else {
            x = (x - min) / (max - min);
            return x * x * (3 - 2 * x);
        }
    }
};

mathf.smootherStep = function(x, min, max) {
    if (x <= min) {
        return 0;
    } else {
        if (x >= max) {
            return 1;
        } else {
            x = (x - min) / (max - min);
            return x * x * x * (x * (x * 6 - 15) + 10);
        }
    }
};

mathf.pingPong = function(x, length) {
    length = +length || 1;
    return length - mathf.abs(x % (2 * length) - length);
};

mathf.degsToRads = function(x) {
    return mathf.standardRadian(x * mathf.TO_RADS);
};

mathf.radsToDegs = function(x) {
    return mathf.standardAngle(x * mathf.TO_DEGS);
};

mathf.randInt = function(min, max) {
    return mathf.round(min + (mathf.random() * (max - min)));
};

mathf.randFloat = function(min, max) {
    return min + (mathf.random() * (max - min));
};

mathf.randSign = function() {
    return mathf.random() < 0.5 ? 1 : -1;
};

mathf.shuffle = function(array) {
    var i = array.length,
        j, x;

    while (i) {
        j = (mathf.random() * i--) | 0;
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }

    return array;
};

mathf.randArg = function() {
    return arguments[(mathf.random() * arguments.length) | 0];
};

mathf.randChoice = function(array) {
    return array[(mathf.random() * array.length) | 0];
};

mathf.randChoiceObject = function(object) {
    var objectKeys = keys(object);
    return object[objectKeys[(mathf.random() * objectKeys.length) | 0]];
};

mathf.isPowerOfTwo = function(x) {
    return (x & -x) === x;
};

mathf.floorPowerOfTwo = function(x) {
    var i = 2,
        prev;

    while (i < x) {
        prev = i;
        i *= 2;
    }

    return prev;
};

mathf.ceilPowerOfTwo = function(x) {
    var i = 2;

    while (i < x) {
        i *= 2;
    }

    return i;
};

var n225 = 0.39269908169872414,
    n675 = 1.1780972450961724,
    n1125 = 1.9634954084936207,
    n1575 = 2.748893571891069,
    n2025 = 3.5342917352885173,
    n2475 = 4.319689898685966,
    n2925 = 5.105088062083414,
    n3375 = 5.8904862254808625,

    RIGHT = "right",
    UP_RIGHT = "up_right",
    UP = "up",
    UP_LEFT = "up_left",
    LEFT = "left",
    DOWN_LEFT = "down_left",
    DOWN = "down",
    DOWN_RIGHT = "down_right";

mathf.directionAngle = function(a) {
    a = mathf.standardRadian(a);

    return (
        (a >= n225 && a < n675) ? UP_RIGHT :
        (a >= n675 && a < n1125) ? UP :
        (a >= n1125 && a < n1575) ? UP_LEFT :
        (a >= n1575 && a < n2025) ? LEFT :
        (a >= n2025 && a < n2475) ? DOWN_LEFT :
        (a >= n2475 && a < n2925) ? DOWN :
        (a >= n2925 && a < n3375) ? DOWN_RIGHT :
        RIGHT
    );
};

mathf.direction = function(x, y) {
    var a = mathf.standardRadian(mathf.atan2(y, x));

    return (
        (a >= n225 && a < n675) ? UP_RIGHT :
        (a >= n675 && a < n1125) ? UP :
        (a >= n1125 && a < n1575) ? UP_LEFT :
        (a >= n1575 && a < n2025) ? LEFT :
        (a >= n2025 && a < n2475) ? DOWN_LEFT :
        (a >= n2475 && a < n2925) ? DOWN :
        (a >= n2925 && a < n3375) ? DOWN_RIGHT :
        RIGHT
    );
};


},
function(require, exports, module, global) {

var isNumber = require(34);


module.exports = Number.isNaN || function isNaN(obj) {
    return isNumber(obj) && obj !== obj;
};


},
function(require, exports, module, global) {

module.exports = isNumber;


function isNumber(obj) {
    return typeof(obj) === "number" || false;
}


},
function(require, exports, module, global) {

var mathf = require(32),
    vec3 = require(36),
    isNumber = require(34);


var color = exports;


color.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


color.create = function(r, g, b) {
    var out = new color.ArrayType(3);

    out[0] = r !== undefined ? r : 0;
    out[1] = g !== undefined ? g : 0;
    out[2] = b !== undefined ? b : 0;

    return out;
};

color.copy = vec3.copy;

color.clone = function(a) {
    var out = new color.ArrayType(3);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    return out;
};

color.setRGB = vec3.set;

color.add = vec3.add;
color.sub = vec3.sub;

color.mul = vec3.mul;
color.div = vec3.div;

color.sadd = vec3.sadd;
color.ssub = vec3.ssub;

color.smul = vec3.smul;
color.sdiv = vec3.sdiv;

color.lengthSqValues = vec3.lengthSqValues;

color.lengthValues = vec3.lengthValues;

color.invLengthValues = vec3.invLengthValues;

color.dot = vec3.dot;

color.lengthSq = vec3.lengthSq;

color.length = vec3.length;

color.invLength = vec3.invLength;

color.setLength = vec3.setLength;

color.normalize = vec3.normalize;

color.lerp = vec3.lerp;

color.min = vec3.min;

color.max = vec3.max;

color.clamp = vec3.clamp;

color.equal = vec3.equal;

color.notEqual = vec3.notEqual;


var cmin = color.create(0, 0, 0),
    cmax = color.create(1, 1, 1);

color.cnormalize = function(out) {
    return color.clamp(out, out, cmin, cmax);
};

color.str = function(out) {
    return "Color(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
};

color.set = function(out, r, g, b) {
    var type = typeof(r);

    if (type === "number") {
        out[0] = r !== undefined ? r : 0;
        out[1] = g !== undefined ? g : 0;
        out[2] = b !== undefined ? b : 0;
    } else if (type === "string") {
        color.setStyle(out, r);
    } else if (r.length === +r.length) {
        out[0] = r[0] || 0;
        out[1] = r[1] || 0;
        out[2] = r[2] || 0;
    }

    return out;
};

function to256(value) {
    return (value * 255) | 0;
}

color.toRGB = function(out, alpha) {
    if (isNumber(alpha)) {
        return "rgba(" + to256(out[0]) + "," + to256(out[1]) + "," + to256(out[2]) + "," + mathf.clamp01(alpha) + ")";
    } else {
        return "rgb(" + to256(out[0]) + "," + to256(out[1]) + "," + to256(out[2]) + ")";
    }
};

function toHEX(value) {
    if (value < 16) {
        return "0" + value.toString(16);
    } else {
        return value.toString(16);
    }
}

color.toHEX = function(out) {
    return "#" + toHEX(out[0]) + toHEX(out[1]) + toHEX(out[2]);
};

var rgb255 = /^rgb\((\d+),(\d+),(\d+)\)$/i,
    rgb100 = /^rgb\((\d+)\%,(\d+)\%,(\d+)\%\)$/i,
    hex6 = /^\#([0.0-9a-f]{6})$/i,
    hex3 = /^\#([0.0-9a-f])([0.0-9a-f])([0.0-9a-f])$/i,
    hex3to6 = /#(.)(.)(.)/,
    hex3to6String = "#$1$1$2$2$3$3",
    colorName = /^(\w+)$/i,
    inv255 = 1 / 255,
    inv100 = 1 / 100;

color.setStyle = function(out, style) {
    var color;

    if (rgb255.test(style)) {
        color = rgb255.exec(style);

        out[0] = mathf.min(255, Number(color[1])) * inv255;
        out[1] = mathf.min(255, Number(color[2])) * inv255;
        out[2] = mathf.min(255, Number(color[3])) * inv255;
    } else if (rgb100.test(style)) {
        color = rgb100.exec(style);

        out[0] = mathf.min(100, Number(color[1])) * inv100;
        out[1] = mathf.min(100, Number(color[2])) * inv100;
        out[2] = mathf.min(100, Number(color[3])) * inv100;
    } else if (hex6.test(style)) {

        out[0] = parseInt(style.substr(1, 2), 16) * inv255;
        out[1] = parseInt(style.substr(3, 2), 16) * inv255;
        out[2] = parseInt(style.substr(5, 2), 16) * inv255;
    } else if (hex3.test(style)) {
        style = style.replace(hex3to6, hex3to6String);

        out[0] = parseInt(style.substr(1, 2), 16) * inv255;
        out[1] = parseInt(style.substr(3, 2), 16) * inv255;
        out[2] = parseInt(style.substr(5, 2), 16) * inv255;
    } else if (colorName.test(style)) {
        style = colorNames[style.toLowerCase()];

        out[0] = parseInt(style.substr(1, 2), 16) * inv255;
        out[1] = parseInt(style.substr(3, 2), 16) * inv255;
        out[2] = parseInt(style.substr(5, 2), 16) * inv255;
    }

    return out;
};

var colorNames = color.colorNames = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgrey: "#d3d3d3",
    lightgreen: "#90ee90",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370d8",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#d87093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
};


},
function(require, exports, module, global) {

var mathf = require(32);


var vec3 = exports;


vec3.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


vec3.create = function(x, y, z) {
    var out = new vec3.ArrayType(3);

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;
    out[2] = z !== undefined ? z : 0;

    return out;
};

vec3.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    return out;
};

vec3.clone = function(a) {
    var out = new vec3.ArrayType(3);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    return out;
};

vec3.set = function(out, x, y, z) {

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;
    out[2] = z !== undefined ? z : 0;

    return out;
};

vec3.add = function(out, a, b) {

    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];

    return out;
};

vec3.sub = function(out, a, b) {

    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];

    return out;
};

vec3.mul = function(out, a, b) {

    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];

    return out;
};

vec3.div = function(out, a, b) {
    var bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
    out[1] = a[1] * (by !== 0 ? 1 / by : by);
    out[2] = a[2] * (bz !== 0 ? 1 / bz : bz);

    return out;
};

vec3.sadd = function(out, a, s) {

    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;

    return out;
};

vec3.ssub = function(out, a, s) {

    out[0] = a[0] - s;
    out[1] = a[1] - s;
    out[2] = a[2] - s;

    return out;
};

vec3.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;

    return out;
};

vec3.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;

    return out;
};

vec3.lengthSqValues = function(x, y, z) {

    return x * x + y * y + z * z;
};

vec3.lengthValues = function(x, y, z) {
    var lsq = vec3.lengthSqValues(x, y, z);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec3.invLengthValues = function(x, y, z) {
    var lsq = vec3.lengthSqValues(x, y, z);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec3.cross = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;

    return out;
};

vec3.dot = function(a, b) {

    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

vec3.lengthSq = function(a) {

    return vec3.dot(a, a);
};

vec3.length = function(a) {
    var lsq = vec3.lengthSq(a);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec3.invLength = function(a) {
    var lsq = vec3.lengthSq(a);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec3.setLength = function(out, a, length) {
    var x = a[0],
        y = a[1],
        z = a[2],
        s = length * vec3.invLengthValues(x, y, z);

    out[0] = x * s;
    out[1] = y * s;
    out[2] = z * s;

    return out;
};

vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        invlsq = vec3.invLengthValues(x, y, z);

    out[0] = x * invlsq;
    out[1] = y * invlsq;
    out[2] = z * invlsq;

    return out;
};

vec3.inverse = function(out, a) {

    out[0] = a[0] * -1;
    out[1] = a[1] * -1;
    out[2] = a[2] * -1;

    return out;
};

vec3.lerp = function(out, a, b, x) {
    var lerp = mathf.lerp;

    out[0] = lerp(a[0], b[0], x);
    out[1] = lerp(a[1], b[1], x);
    out[2] = lerp(a[2], b[2], x);

    return out;
};

vec3.min = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = bx < ax ? bx : ax;
    out[1] = by < ay ? by : ay;
    out[2] = bz < az ? bz : az;

    return out;
};

vec3.max = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = bx > ax ? bx : ax;
    out[1] = by > ay ? by : ay;
    out[2] = bz > az ? bz : az;

    return out;
};

vec3.clamp = function(out, a, min, max) {
    var x = a[0],
        y = a[1],
        z = a[2],
        minx = min[0],
        miny = min[1],
        minz = min[2],
        maxx = max[0],
        maxy = max[1],
        maxz = max[2];

    out[0] = x < minx ? minx : x > maxx ? maxx : x;
    out[1] = y < miny ? miny : y > maxy ? maxy : y;
    out[2] = z < minz ? minz : z > maxz ? maxz : z;

    return out;
};

vec3.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2];

    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];

    return out;
};

vec3.transformMat4 = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2];

    out[0] = x * m[0] + y * m[4] + z * m[8] + m[12];
    out[1] = x * m[1] + y * m[5] + z * m[9] + m[13];
    out[2] = x * m[2] + y * m[6] + z * m[10] + m[14];

    return out;
};

vec3.transformMat4Rotation = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2];

    out[0] = x * m[0] + y * m[4] + z * m[8];
    out[1] = x * m[1] + y * m[5] + z * m[9];
    out[2] = x * m[2] + y * m[6] + z * m[10];

    return out;
};

vec3.transformProjection = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2],
        d = x * m[3] + y * m[7] + z * m[11] + m[15];

    d = d !== 0 ? 1 / d : d;

    out[0] = (x * m[0] + y * m[4] + z * m[8] + m[12]) * d;
    out[1] = (x * m[1] + y * m[5] + z * m[9] + m[13]) * d;
    out[2] = (x * m[2] + y * m[6] + z * m[10] + m[14]) * d;

    return out;
};

vec3.transformQuat = function(out, a, q) {
    var x = a[0],
        y = a[1],
        z = a[2],
        qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3],

        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return out;
};

vec3.positionFromMat4 = function(out, m) {

    out[0] = m[12];
    out[1] = m[13];
    out[2] = m[14];

    return out;
};

vec3.scaleFromMat3 = function(out, m) {

    out[0] = vec3.lengthValues(m[0], m[3], m[6]);
    out[1] = vec3.lengthValues(m[1], m[4], m[7]);
    out[2] = vec3.lengthValues(m[2], m[5], m[8]);

    return out;
};

vec3.scaleFromMat4 = function(out, m) {

    out[0] = vec3.lengthValues(m[0], m[4], m[8]);
    out[1] = vec3.lengthValues(m[1], m[5], m[9]);
    out[2] = vec3.lengthValues(m[2], m[6], m[10]);

    return out;
};

vec3.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2]
    );
};

vec3.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2]
    );
};

vec3.str = function(out) {

    return "Vec3(" + out[0] + ", " + out[1] + ", " + out[2] + ")";
};


},
function(require, exports, module, global) {

var reverse = require(38);


var enums = exports;


enums.blending = require(41);
enums.cullFace = require(45);
enums.depth = require(47);
enums.filterMode = require(48);

enums.gl = require(46);
enums.glValues = reverse(enums.gl);

enums.textureFormat = require(49);
enums.textureType = require(50);
enums.textureWrap = require(51);


},
function(require, exports, module, global) {

var keys = require(14),
    isArrayLike = require(39);


module.exports = reverse;


function reverse(object) {
    return isArrayLike(object) ? reverseArray(object) : reverseObject(Object(object));
}

function reverseArray(array) {
    var i = array.length,
        results = new Array(i),
        j = 0;

    while (i--) {
        results[j++] = array[i];
    }

    return results;
}

function reverseObject(object) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        results = {},
        key;

    while (i++ < il) {
        key = objectKeys[i];
        results[object[key]] = key;
    }

    return results;
}


},
function(require, exports, module, global) {

var isLength = require(40),
    isObjectLike = require(22);


module.exports = isArrayLike;


function isArrayLike(obj) {
    return isObjectLike(obj) && isLength(obj.length);
}


},
function(require, exports, module, global) {

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;


module.exports = isLength;


function isLength(obj) {
    return typeof(obj) === "number" && obj > -1 && obj % 1 === 0 && obj <= MAX_SAFE_INTEGER;
}


},
function(require, exports, module, global) {

var enums = require(42);


module.exports = enums([
    "NONE",
    "DEFAULT",
    "ADDITIVE",
    "SUBTRACTIVE",
    "MULTIPLY"
]);


},
function(require, exports, module, global) {

var create = require(12),
    defineProperty = require(21),
    forEach = require(43),
    isString = require(18),
    isNumber = require(34),
    emptyFunction = require(28);


var reSpliter = /[\s\, ]+/,
    descriptor = {
        configurable: false,
        enumerable: true,
        writable: false,
        value: null
    },
    freeze = Object.freeze || emptyFunction;


module.exports = enums;


function enums(values) {
    if (isString(values)) {
        values = values.split(reSpliter);
        return createEnums(values);
    } else if (values) {
        return createEnums(values);
    } else {
        throw new TypeError("enums(values) values must be an array or a string");
    }
}

function createEnums(values) {
    var object = create(null);
    forEach(values, createEnum.set(object));
    freeze(object);
    return object;
}

function createEnum(value, key) {
    if (isNumber(key)) {
        key = value;
        value = stringToHash(value);
    }

    descriptor.value = value;
    defineProperty(createEnum.object, key, descriptor);
    descriptor.value = null;
}

createEnum.set = function(object) {
    this.object = object;
    return this;
};

function stringToHash(value) {
    var result = 0,
        i = -1,
        il = value.length - 1;

    while (i++ < il) {
        result = result * 31 + value.charCodeAt(i);
    }

    return result;
}


},
function(require, exports, module, global) {

var keys = require(14),
    isNullOrUndefined = require(19),
    fastBindThis = require(44),
    isArrayLike = require(39);


module.exports = forEach;


function forEach(object, callback, thisArg) {
    callback = isNullOrUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 2);
    return isArrayLike(object) ? forEachArray(object, callback) : forEachObject(object, callback);
}

function forEachArray(array, callback) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        if (callback(array[i], i) === false) {
            return false;
        }
    }

    return array;
}

function forEachObject(object, callback) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        key;

    while (i++ < il) {
        key = objectKeys[i];

        if (callback(object[key], key) === false) {
            return false;
        }
    }

    return object;
}


},
function(require, exports, module, global) {

var isNumber = require(34);


module.exports = fastBindThis;


function fastBindThis(callback, thisArg, length) {
    switch ((isNumber(length) ? length : callback.length) || 0) {
        case 0:
            return function bound() {
                return callback.call(thisArg);
            };
        case 1:
            return function bound(a1) {
                return callback.call(thisArg, a1);
            };
        case 2:
            return function bound(a1, a2) {
                return callback.call(thisArg, a1, a2);
            };
        case 3:
            return function bound(a1, a2, a3) {
                return callback.call(thisArg, a1, a2, a3);
            };
        case 4:
            return function bound(a1, a2, a3, a4) {
                return callback.call(thisArg, a1, a2, a3, a4);
            };
        default:
            return function bound() {
                return callback.apply(thisArg, arguments);
            };
    }
}


},
function(require, exports, module, global) {

var enums = require(42),
    gl = require(46);


module.exports = enums({
    NONE: 1,
    BACK: gl.BACK,
    FRONT: gl.FRONT,
    FRONT_AND_BACK: gl.FRONT_AND_BACK
});


},
function(require, exports, module, global) {

var enums = require(42);


module.exports = enums({
    ACTIVE_ATTRIBUTES: 35721,
    ACTIVE_TEXTURE: 34016,
    ACTIVE_UNIFORMS: 35718,
    ALIASED_LINE_WIDTH_RANGE: 33902,
    ALIASED_POINT_SIZE_RANGE: 33901,
    ALPHA: 6406,
    ALPHA_BITS: 3413,
    ALWAYS: 519,
    ARRAY_BUFFER: 34962,
    ARRAY_BUFFER_BINDING: 34964,
    ATTACHED_SHADERS: 35717,
    BACK: 1029,
    BLEND: 3042,
    BLEND_COLOR: 32773,
    BLEND_DST_ALPHA: 32970,
    BLEND_DST_RGB: 32968,
    BLEND_EQUATION: 32777,
    BLEND_EQUATION_ALPHA: 34877,
    BLEND_EQUATION_RGB: 32777,
    BLEND_SRC_ALPHA: 32971,
    BLEND_SRC_RGB: 32969,
    BLUE_BITS: 3412,
    BOOL: 35670,
    BOOL_VEC2: 35671,
    BOOL_VEC3: 35672,
    BOOL_VEC4: 35673,
    BROWSER_DEFAULT_WEBGL: 37444,
    BUFFER_SIZE: 34660,
    BUFFER_USAGE: 34661,
    BYTE: 5120,
    CCW: 2305,
    CLAMP_TO_EDGE: 33071,
    COLOR_ATTACHMENT0: 36064,
    COLOR_BUFFER_BIT: 16384,
    COLOR_CLEAR_VALUE: 3106,
    COLOR_WRITEMASK: 3107,
    COMPILE_STATUS: 35713,
    COMPRESSED_TEXTURE_FORMATS: 34467,
    CONSTANT_ALPHA: 32771,
    CONSTANT_COLOR: 32769,
    CONTEXT_LOST_WEBGL: 37442,
    CULL_FACE: 2884,
    CULL_FACE_MODE: 2885,
    CURRENT_PROGRAM: 35725,
    CURRENT_VERTEX_ATTRIB: 34342,
    CW: 2304,
    DECR: 7683,
    DECR_WRAP: 34056,
    DELETE_STATUS: 35712,
    DEPTH_ATTACHMENT: 36096,
    DEPTH_BITS: 3414,
    DEPTH_BUFFER_BIT: 256,
    DEPTH_CLEAR_VALUE: 2931,
    DEPTH_COMPONENT: 6402,
    DEPTH_COMPONENT16: 33189,
    DEPTH_FUNC: 2932,
    DEPTH_RANGE: 2928,
    DEPTH_STENCIL: 34041,
    DEPTH_STENCIL_ATTACHMENT: 33306,
    DEPTH_TEST: 2929,
    DEPTH_WRITEMASK: 2930,
    DITHER: 3024,
    DONT_CARE: 4352,
    DST_ALPHA: 772,
    DST_COLOR: 774,
    DYNAMIC_DRAW: 35048,
    ELEMENT_ARRAY_BUFFER: 34963,
    ELEMENT_ARRAY_BUFFER_BINDING: 34965,
    EQUAL: 514,
    FASTEST: 4353,
    FLOAT: 5126,
    FLOAT_MAT2: 35674,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    FRAGMENT_SHADER: 35632,
    FRAMEBUFFER: 36160,
    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 36049,
    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 36048,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 36051,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 36050,
    FRAMEBUFFER_BINDING: 36006,
    FRAMEBUFFER_COMPLETE: 36053,
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
    FRAMEBUFFER_UNSUPPORTED: 36061,
    FRONT: 1028,
    FRONT_AND_BACK: 1032,
    FRONT_FACE: 2886,
    FUNC_ADD: 32774,
    FUNC_REVERSE_SUBTRACT: 32779,
    FUNC_SUBTRACT: 32778,
    GENERATE_MIPMAP_HINT: 33170,
    GEQUAL: 518,
    GREATER: 516,
    GREEN_BITS: 3411,
    HIGH_FLOAT: 36338,
    HIGH_INT: 36341,
    IMPLEMENTATION_COLOR_READ_FORMAT: 35739,
    IMPLEMENTATION_COLOR_READ_TYPE: 35738,
    INCR: 7682,
    INCR_WRAP: 34055,
    INT: 5124,
    INT_VEC2: 35667,
    INT_VEC3: 35668,
    INT_VEC4: 35669,
    INVALID_ENUM: 1280,
    INVALID_FRAMEBUFFER_OPERATION: 1286,
    INVALID_OPERATION: 1282,
    INVALID_VALUE: 1281,
    INVERT: 5386,
    KEEP: 7680,
    LEQUAL: 515,
    LESS: 513,
    LINEAR: 9729,
    LINEAR_MIPMAP_LINEAR: 9987,
    LINEAR_MIPMAP_NEAREST: 9985,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    LINE_WIDTH: 2849,
    LINK_STATUS: 35714,
    LOW_FLOAT: 36336,
    LOW_INT: 36339,
    LUMINANCE: 6409,
    LUMINANCE_ALPHA: 6410,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
    MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
    MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
    MAX_RENDERBUFFER_SIZE: 34024,
    MAX_TEXTURE_IMAGE_UNITS: 34930,
    MAX_TEXTURE_SIZE: 3379,
    MAX_VARYING_VECTORS: 36348,
    MAX_VERTEX_ATTRIBS: 34921,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
    MAX_VERTEX_UNIFORM_VECTORS: 36347,
    MAX_VIEWPORT_DIMS: 3386,
    MEDIUM_FLOAT: 36337,
    MEDIUM_INT: 36340,
    MIRRORED_REPEAT: 33648,
    NEAREST: 9728,
    NEAREST_MIPMAP_LINEAR: 9986,
    NEAREST_MIPMAP_NEAREST: 9984,
    NEVER: 512,
    NICEST: 4354,
    NONE: 0,
    NOTEQUAL: 517,
    NO_ERROR: 0,
    ONE: 1,
    ONE_MINUS_CONSTANT_ALPHA: 32772,
    ONE_MINUS_CONSTANT_COLOR: 32770,
    ONE_MINUS_DST_ALPHA: 773,
    ONE_MINUS_DST_COLOR: 775,
    ONE_MINUS_SRC_ALPHA: 771,
    ONE_MINUS_SRC_COLOR: 769,
    OUT_OF_MEMORY: 1285,
    PACK_ALIGNMENT: 3333,
    POINTS: 0,
    POLYGON_OFFSET_FACTOR: 32824,
    POLYGON_OFFSET_FILL: 32823,
    POLYGON_OFFSET_UNITS: 10752,
    RED_BITS: 3410,
    RENDERBUFFER: 36161,
    RENDERBUFFER_ALPHA_SIZE: 36179,
    RENDERBUFFER_BINDING: 36007,
    RENDERBUFFER_BLUE_SIZE: 36178,
    RENDERBUFFER_DEPTH_SIZE: 36180,
    RENDERBUFFER_GREEN_SIZE: 36177,
    RENDERBUFFER_HEIGHT: 36163,
    RENDERBUFFER_INTERNAL_FORMAT: 36164,
    RENDERBUFFER_RED_SIZE: 36176,
    RENDERBUFFER_STENCIL_SIZE: 36181,
    RENDERBUFFER_WIDTH: 36162,
    RENDERER: 7937,
    REPEAT: 10497,
    REPLACE: 7681,
    RGB: 6407,
    RGB5_A1: 32855,
    RGB565: 36194,
    RGBA: 6408,
    RGBA4: 32854,
    SAMPLER_2D: 35678,
    SAMPLER_CUBE: 35680,
    SAMPLES: 32937,
    SAMPLE_ALPHA_TO_COVERAGE: 32926,
    SAMPLE_BUFFERS: 32936,
    SAMPLE_COVERAGE: 32928,
    SAMPLE_COVERAGE_INVERT: 32939,
    SAMPLE_COVERAGE_VALUE: 32938,
    SCISSOR_BOX: 3088,
    SCISSOR_TEST: 3089,
    SHADER_TYPE: 35663,
    SHADING_LANGUAGE_VERSION: 35724,
    SHORT: 5122,
    SRC_ALPHA: 770,
    SRC_ALPHA_SATURATE: 776,
    SRC_COLOR: 768,
    STATIC_DRAW: 35044,
    STENCIL_ATTACHMENT: 36128,
    STENCIL_BACK_FAIL: 34817,
    STENCIL_BACK_FUNC: 34816,
    STENCIL_BACK_PASS_DEPTH_FAIL: 34818,
    STENCIL_BACK_PASS_DEPTH_PASS: 34819,
    STENCIL_BACK_REF: 36003,
    STENCIL_BACK_VALUE_MASK: 36004,
    STENCIL_BACK_WRITEMASK: 36005,
    STENCIL_BITS: 3415,
    STENCIL_BUFFER_BIT: 1024,
    STENCIL_CLEAR_VALUE: 2961,
    STENCIL_FAIL: 2964,
    STENCIL_FUNC: 2962,
    STENCIL_INDEX: 6401,
    STENCIL_INDEX8: 36168,
    STENCIL_PASS_DEPTH_FAIL: 2965,
    STENCIL_PASS_DEPTH_PASS: 2966,
    STENCIL_REF: 2967,
    STENCIL_TEST: 2960,
    STENCIL_VALUE_MASK: 2963,
    STENCIL_WRITEMASK: 2968,
    STREAM_DRAW: 35040,
    SUBPIXEL_BITS: 3408,
    TEXTURE: 5890,
    TEXTURE0: 33984,
    TEXTURE1: 33985,
    TEXTURE2: 33986,
    TEXTURE3: 33987,
    TEXTURE4: 33988,
    TEXTURE5: 33989,
    TEXTURE6: 33990,
    TEXTURE7: 33991,
    TEXTURE8: 33992,
    TEXTURE9: 33993,
    TEXTURE10: 33994,
    TEXTURE11: 33995,
    TEXTURE12: 33996,
    TEXTURE13: 33997,
    TEXTURE14: 33998,
    TEXTURE15: 33999,
    TEXTURE16: 34000,
    TEXTURE17: 34001,
    TEXTURE18: 34002,
    TEXTURE19: 34003,
    TEXTURE20: 34004,
    TEXTURE21: 34005,
    TEXTURE22: 34006,
    TEXTURE23: 34007,
    TEXTURE24: 34008,
    TEXTURE25: 34009,
    TEXTURE26: 34010,
    TEXTURE27: 34011,
    TEXTURE28: 34012,
    TEXTURE29: 34013,
    TEXTURE30: 34014,
    TEXTURE31: 34015,
    TEXTURE_2D: 3553,
    TEXTURE_BINDING_2D: 32873,
    TEXTURE_BINDING_CUBE_MAP: 34068,
    TEXTURE_CUBE_MAP: 34067,
    TEXTURE_CUBE_MAP_NEGATIVE_X: 34070,
    TEXTURE_CUBE_MAP_NEGATIVE_Y: 34072,
    TEXTURE_CUBE_MAP_NEGATIVE_Z: 34074,
    TEXTURE_CUBE_MAP_POSITIVE_X: 34069,
    TEXTURE_CUBE_MAP_POSITIVE_Y: 34071,
    TEXTURE_CUBE_MAP_POSITIVE_Z: 34073,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    TRIANGLES: 4,
    TRIANGLE_FAN: 6,
    TRIANGLE_STRIP: 5,
    UNPACK_ALIGNMENT: 3317,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
    UNPACK_FLIP_Y_WEBGL: 37440,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_INT: 5125,
    UNSIGNED_SHORT: 5123,
    UNSIGNED_SHORT_4_4_4_4: 32819,
    UNSIGNED_SHORT_5_5_5_1: 32820,
    UNSIGNED_SHORT_5_6_5: 33635,
    VALIDATE_STATUS: 35715,
    VENDOR: 7936,
    VERSION: 7938,
    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 34975,
    VERTEX_ATTRIB_ARRAY_ENABLED: 34338,
    VERTEX_ATTRIB_ARRAY_NORMALIZED: 34922,
    VERTEX_ATTRIB_ARRAY_POINTER: 34373,
    VERTEX_ATTRIB_ARRAY_SIZE: 34339,
    VERTEX_ATTRIB_ARRAY_STRIDE: 34340,
    VERTEX_ATTRIB_ARRAY_TYPE: 34341,
    VERTEX_SHADER: 35633,
    VIEWPORT: 2978,
    ZERO: 0
});


},
function(require, exports, module, global) {

var enums = require(42),
    gl = require(46);


module.exports = enums({
    NONE: 1,
    NEVER: gl.NEVER,
    LESS: gl.LESS,
    EQUAL: gl.EQUAL,
    LEQUAL: gl.LEQUAL,
    GREATER: gl.GREATER,
    NOTEQUAL: gl.NOTEQUAL,
    GEQUAL: gl.GEQUAL,
    ALWAYS: gl.ALWAYS
});


},
function(require, exports, module, global) {

var enums = require(42);


module.exports = enums({
    NONE: 1,
    LINEAR: 2
});


},
function(require, exports, module, global) {

var enums = require(42),
    gl = require(46);


module.exports = enums({
    RGB: gl.RGB,
    RGBA: gl.RGBA,
    ALPHA: gl.ALPHA,
    LUMINANCE: gl.LUMINANCE,
    LUMINANCE_ALPHA: gl.LUMINANCE_ALPHA
});


},
function(require, exports, module, global) {

var enums = require(42),
    gl = require(46);


module.exports = enums({
    UNSIGNED_BYTE: gl.UNSIGNED_BYTE,
    FLOAT: gl.FLOAT,
    DEPTH_COMPONENT: gl.DEPTH_COMPONENT,
    UNSIGNED_SHORT: gl.UNSIGNED_SHORT,
    UNSIGNED_SHORT_5_6_5: gl.UNSIGNED_SHORT_5_6_5,
    UNSIGNED_SHORT_4_4_4_4: gl.UNSIGNED_SHORT_4_4_4_4,
    UNSIGNED_SHORT_5_5_5_1: gl.UNSIGNED_SHORT_5_5_5_1
});


},
function(require, exports, module, global) {

var enums = require(42),
    gl = require(46);


module.exports = enums({
    REPEAT: gl.REPEAT,
    CLAMP: gl.CLAMP_TO_EDGE,
    MIRRORED_REPEAT: gl.MIRRORED_REPEAT
});


},
function(require, exports, module, global) {

module.exports = WebGLBuffer;


function WebGLBuffer(context) {

    this.context = context;

    this.stride = 0;
    this.type = null;
    this.draw = null;
    this.length = null;
    this.glBuffer = null;
    this.needsCompile = true;
}

WebGLBuffer.prototype.compile = function(type, array, stride, draw) {
    var gl = this.context.gl,
        glBuffer = this.glBuffer || (this.glBuffer = gl.createBuffer());

    gl.bindBuffer(type, glBuffer);
    gl.bufferData(type, array, draw);

    this.type = type;
    this.stride = stride || 0;
    this.draw = draw;
    this.length = array.length;

    this.needsCompile = false;

    return this;
};


},
function(require, exports, module, global) {

var isArray = require(54),
    mathf = require(32),
    enums = require(37);


var textureType = enums.textureType,
    filterMode = enums.filterMode;


module.exports = WebGLTexture;


function WebGLTexture(context, texture) {
    var _this = this;

    this.context = context;
    this.texture = texture;

    this.isCubeMap = false;
    this.needsCompile = true;
    this.glTexture = null;

    texture.on("update", function() {
        _this.needsCompile = true;
    });
}

WebGLTexture.prototype.getGLTexture = function() {
    if (this.needsCompile === false) {
        return this.glTexture;
    } else {
        return WebGLTexture_getGLTexture(this);
    }
};

function WebGLTexture_getGLTexture(_this) {
    var texture = _this.texture,

        context = _this.context,
        gl = context.gl,

        glTexture = _this.glTexture || (_this.glTexture = gl.createTexture()),

        image = texture.data,
        notNull = image != null,
        isCubeMap = isArray(image),

        width = texture.width,
        height = texture.height,
        isPOT = mathf.isPowerOfTwo(width) && mathf.isPowerOfTwo(height),

        generateMipmap = texture.generateMipmap,
        flipY = texture.flipY,
        premultiplyAlpha = texture.premultiplyAlpha,
        anisotropy = texture.anisotropy,
        filter = texture.filter,
        format = getFormat(gl, texture.format),
        wrap = isPOT ? getWrap(gl, texture.wrap) : gl.CLAMP_TO_EDGE,
        type = getType(gl, texture.type),

        TFA = (anisotropy > 0) && context.getExtension("EXT_texture_filter_anisotropic"),
        TEXTURE_TYPE = isCubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,
        minFilter, magFilter, images, i, il;

    if (TFA) {
        anisotropy = mathf.clamp(anisotropy, 1, context.__maxAnisotropy);
    }

    if (notNull) {
        if (isCubeMap) {
            images = [];
            i = -1;
            il = image.length - 1;

            while (i++ < il) {
                images[i] = context.clampMaxSize(image[i], isCubeMap);
            }
        } else {
            image = context.clampMaxSize(image, false);
        }
    }

    if (filter === filterMode.NONE) {
        magFilter = gl.NEAREST;
        minFilter = isPOT && generateMipmap ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST;
    } else { //filterMode.LINEAR
        magFilter = gl.LINEAR;
        minFilter = isPOT && generateMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
    }

    if (
        (type === textureType.FLOAT && !context.getExtension("OES_texture_float")) ||
        (type === textureType.DEPTH_COMPONENT && !context.getExtension("WEBGL_depth_texture"))
    ) {
        type = gl.UNSIGNED_BYTE;
    }

    gl.bindTexture(TEXTURE_TYPE, glTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha ? 1 : 0);

    if (notNull) {
        if (isCubeMap) {
            i = images.length;
            while (i--) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, format, type, images[i]);
            }
        } else {
            gl.texImage2D(TEXTURE_TYPE, 0, format, format, type, image);
        }
    } else {
        if (isCubeMap) {
            i = image.length;
            while (i--) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, width, height, 0, format, type, null);
            }
        } else {
            if (type === textureType.DEPTH_COMPONENT) {
                gl.texImage2D(TEXTURE_TYPE, 0, type, width, height, 0, type, gl.UNSIGNED_SHORT, null);
            } else {
                gl.texImage2D(TEXTURE_TYPE, 0, format, width, height, 0, format, type, null);
            }
        }
    }

    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_MIN_FILTER, minFilter);

    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_WRAP_T, wrap);

    if (TFA) {
        gl.texParameterf(TEXTURE_TYPE, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
    }
    if (generateMipmap && isPOT) {
        gl.generateMipmap(TEXTURE_TYPE);
    }

    _this.isCubeMap = isCubeMap;
    _this.needsCompile = false;

    gl.bindTexture(TEXTURE_TYPE, null);

    return glTexture;
}

function getFormat(gl, format) {
    switch (format) {
        case gl.RGB:
            return gl.RGB;
        case gl.ALPHA:
            return gl.ALPHA;
        case gl.LUMINANCE:
            return gl.LUMINANCE;
        case gl.LUMINANCE_ALPHA:
            return gl.LUMINANCE_ALPHA;
        default:
            return gl.RGBA;
    }
}

function getType(gl, type) {
    switch (type) {
        case gl.FLOAT:
            return gl.FLOAT;
        case gl.DEPTH_COMPONENT:
            return gl.DEPTH_COMPONENT;
        case gl.UNSIGNED_SHORT:
            return gl.UNSIGNED_SHORT;
        case gl.UNSIGNED_SHORT_5_6_5:
            return gl.UNSIGNED_SHORT_5_6_5;
        case gl.UNSIGNED_SHORT_4_4_4_4:
            return gl.UNSIGNED_SHORT_4_4_4_4;
        case gl.UNSIGNED_SHORT_5_5_5_1:
            return gl.UNSIGNED_SHORT_5_5_5_1;
        default:
            return gl.UNSIGNED_BYTE;
    }
}

function getWrap(gl, wrap) {
    switch (wrap) {
        case gl.REPEAT:
            return gl.REPEAT;
        case gl.MIRRORED_REPEAT:
            return gl.MIRRORED_REPEAT;
        default:
            return gl.CLAMP_TO_EDGE;
    }
}


},
function(require, exports, module, global) {

var isLength = require(40),
    isObjectLike = require(22);


var objectToString = Object.prototype.toString;


module.exports = Array.isArray || function isArray(obj) {
    return (
        isObjectLike(obj) &&
        isLength(obj.length) &&
        objectToString.call(obj) === "[object Array]"
    ) || false;
};


},
function(require, exports, module, global) {

var isArray = require(54),
    FastHash = require(56),

    enums = require(37),
    uniforms = require(58),
    attributes = require(79);


var reUniformName = /[^\[]+/;


module.exports = WebGLProgram;


function WebGLProgram(context) {

    this.context = context;

    this.floatPrecision = context.__precision;
    this.intPrecision = context.__precision;

    this.uniforms = new FastHash("name");
    this.attributes = new FastHash("name");

    this.needsCompile = true;
    this.glProgram = null;
}

WebGLProgram.prototype.compile = function(vertex, fragment) {
    var context = this.context,
        floatPrecision = this.floatPrecision,
        intPrecision = this.intPrecision,
        uniforms = this.uniforms,
        attributes = this.attributes,
        gl = context.gl,
        glProgram = this.glProgram;

    if (glProgram) {
        uniforms.clear();
        attributes.clear();
        gl.deleteProgram(glProgram);
    }

    glProgram = this.glProgram = createProgram(
        gl,
        prependPrecision(floatPrecision, intPrecision, vertex),
        prependPrecision(floatPrecision, intPrecision, fragment)
    );

    parseUniforms(gl, context, glProgram, uniforms);
    parseAttributes(gl, context, glProgram, attributes);

    this.needsCompile = false;

    return this;
};

function parseUniforms(gl, context, glProgram, hash) {
    var length = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS),
        glValues = enums.glValues,
        i = -1,
        il = length - 1,
        uniform, name, location;

    while (i++ < il) {
        uniform = gl.getActiveUniform(glProgram, i);
        name = reUniformName.exec(uniform.name)[0];
        location = gl.getUniformLocation(glProgram, name);
        hash.add(new uniforms[glValues[uniform.type]](context, name, location, uniform.size));
    }
}

function parseAttributes(gl, context, glProgram, hash) {
    var length = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES),
        glValues = enums.glValues,
        i = -1,
        il = length - 1,
        attribute, name, location;

    while (i++ < il) {
        attribute = gl.getActiveAttrib(glProgram, i);
        name = attribute.name;
        location = gl.getAttribLocation(glProgram, name);
        hash.add(new attributes[glValues[attribute.type]](context, name, location));
    }
}

function prependPrecision(floatPrecision, intPrecision, shader) {
    return "precision " + floatPrecision + " float;\nprecision " + intPrecision + " int;\n" + shader;
}

function createProgram(gl, vertex, fragment) {
    var program = gl.createProgram(),
        shader, i, il, programInfoLog;

    vertex = isArray(vertex) ? vertex : [vertex];
    fragment = isArray(fragment) ? fragment : [fragment];

    i = -1;
    il = vertex.length - 1;
    while (i++ < il) {
        shader = createShader(gl, vertex[i], gl.VERTEX_SHADER);
        gl.attachShader(program, shader);
        gl.deleteShader(shader);
    }

    i = -1;
    il = fragment.length - 1;
    while (i++ < il) {
        shader = createShader(gl, fragment[i], gl.FRAGMENT_SHADER);
        gl.attachShader(program, shader);
        gl.deleteShader(shader);
    }

    gl.linkProgram(program);
    gl.validateProgram(program);
    gl.useProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        programInfoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("createProgram: problem compiling Program " + programInfoLog);
    }

    return program;
}

function createShader(gl, source, type) {
    var shader = gl.createShader(type),
        shaderInfoLog;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        shaderInfoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("createShader: problem compiling shader " + shaderInfoLog);
    }

    return shader;
}


},
function(require, exports, module, global) {

var has = require(10),
    indexOf = require(57),
    forEach = require(43);


module.exports = FastHash;


function FastHash(key) {
    this.__key = key;
    this.__array = [];
    this.__hash = {};
}

FastHash.prototype.get = function(key) {
    return this.__hash[key];
};

FastHash.prototype.has = function(key) {
    return has(this.__hash, key);
};

FastHash.prototype.count = function() {
    return this.__array.length;
};

FastHash.prototype.clear = function() {
    var hash = this.__hash,
        key;

    for (key in hash) {
        if (has(hash, key)) {
            delete hash[key];
        }
    }
    this.__array.length = 0;

    return this;
};

FastHash.prototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        FastHash_add(this, arguments[i]);
    }

    return this;
};

function FastHash_add(_this, value) {
    var array = _this.__array,
        hash = _this.__hash,
        key = value[_this.__key];

    if (!has(hash, key)) {
        hash[key] = value;
        array[array.length] = value;
    }
}

FastHash.prototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        FastHash_remove(this, arguments[i]);
    }

    return this;
};

function FastHash_remove(_this, value) {
    var array = _this.__array,
        hash = _this.__hash,
        key = value[_this.__key];

    if (has(hash, key)) {
        delete hash[key];
        array.splice(indexOf(value), 1);
    }
}

FastHash.prototype.forEach = function(callback, thisArg) {
    return forEach(this.__array, callback, thisArg);
};


},
function(require, exports, module, global) {

var isLength = require(40),
    isObjectLike = require(22);


module.exports = indexOf;


function indexOf(array, value, fromIndex) {
    return (isObjectLike(array) && isLength(array.length)) ? arrayIndexOf(array, value, fromIndex || 0) : -1;
}

function arrayIndexOf(array, value, fromIndex) {
    var i = fromIndex - 1,
        il = array.length - 1;

    while (i++ < il) {
        if (array[i] === value) {
            return i;
        }
    }

    return -1;
}


},
function(require, exports, module, global) {

module.exports = {
    BOOL: require(59),
    INT: require(61),
    FLOAT: require(62),

    BOOL_VEC2: require(63),
    BOOL_VEC3: require(65),
    BOOL_VEC4: require(66),

    INT_VEC2: require(63),
    INT_VEC3: require(65),
    INT_VEC4: require(66),

    FLOAT_VEC2: require(68),
    FLOAT_VEC3: require(69),
    FLOAT_VEC4: require(70),

    FLOAT_MAT2: require(71),
    FLOAT_MAT3: require(73),
    FLOAT_MAT4: require(75),

    SAMPLER_2D: require(77),
    SAMPLER_CUBE: require(78)
};


},
function(require, exports, module, global) {

var Uniform = require(60);


var NativeInt32Array = typeof(Int32Array) !== "undefined" ? Int32Array : Array;


module.exports = Uniform1b;


function Uniform1b(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? NaN : new NativeInt32Array(size);
}
Uniform.extend(Uniform1b);

Uniform1b.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || this.value !== value) {
            context.gl.uniform1i(this.location, value);
            this.value = value;
        }
    } else {
        context.gl.uniform1iv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var inherits = require(11);


module.exports = Uniform;


function Uniform(context, name, location, size) {
    this.name = name;
    this.location = location;
    this.context = context;
    this.size = size;
    this.value = null;
}

Uniform.extend = function(child) {
    return inherits(child, this);
};

Uniform.prototype.set = function( /* value, force */ ) {
    return this;
};


},
function(require, exports, module, global) {

var Uniform = require(60);


var NativeInt32Array = typeof(Int32Array) !== "undefined" ? Int32Array : Array;


module.exports = Uniform1i;


function Uniform1i(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? NaN : new NativeInt32Array(size);
}
Uniform.extend(Uniform1i);

Uniform1i.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || this.value !== value) {
            context.gl.uniform1i(this.location, value);
            this.value = value;
        }
    } else {
        context.gl.uniform1iv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = Uniform1f;


function Uniform1f(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? NaN : new NativeFloat32Array(size);
}
Uniform.extend(Uniform1f);

Uniform1f.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || this.value !== value) {
            context.gl.uniform1f(this.location, value);
            this.value = value;
        }
    } else {
        context.gl.uniform1fv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var vec2 = require(64),
    Uniform = require(60);


var NativeInt32Array = typeof(Int32Array) !== "undefined" ? Int32Array : Array;


module.exports = Uniform2i;


function Uniform2i(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec2.create(NaN, NaN) : new NativeInt32Array(size * 2);
}
Uniform.extend(Uniform2i);

Uniform2i.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec2.notEqual(this.value, value)) {
            context.gl.uniform2i(this.location, value[0], value[1]);
            vec2.copy(this.value, value);
        }
    } else {
        context.gl.uniform2iv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var vec2 = exports;


vec2.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


vec2.create = function(x, y) {
    var out = new vec2.ArrayType(2);

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;

    return out;
};

vec2.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];

    return out;
};

vec2.clone = function(a) {
    var out = new vec2.ArrayType(2);

    out[0] = a[0];
    out[1] = a[1];

    return out;
};

vec2.set = function(out, x, y) {

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;

    return out;
};

vec2.add = function(out, a, b) {

    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];

    return out;
};

vec2.sub = function(out, a, b) {

    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];

    return out;
};

vec2.mul = function(out, a, b) {

    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];

    return out;
};

vec2.div = function(out, a, b) {
    var bx = b[0],
        by = b[1];

    out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
    out[1] = a[1] * (by !== 0 ? 1 / by : by);

    return out;
};

vec2.sadd = function(out, a, s) {

    out[0] = a[0] + s;
    out[1] = a[1] + s;

    return out;
};

vec2.ssub = function(out, a, s) {

    out[0] = a[0] - s;
    out[1] = a[1] - s;

    return out;
};

vec2.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;

    return out;
};

vec2.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;

    return out;
};

vec2.lengthSqValues = function(x, y) {

    return x * x + y * y;
};

vec2.lengthValues = function(x, y) {
    var lsq = vec2.lengthSqValues(x, y);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec2.invLengthValues = function(x, y) {
    var lsq = vec2.lengthSqValues(x, y);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec2.cross = function(a, b) {

    return a[0] * b[1] - a[1] * b[0];
};

vec2.dot = function(a, b) {

    return a[0] * b[0] + a[1] * b[1];
};

vec2.lengthSq = function(a) {

    return vec2.dot(a, a);
};

vec2.length = function(a) {
    var lsq = vec2.lengthSq(a);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec2.invLength = function(a) {
    var lsq = vec2.lengthSq(a);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec2.setLength = function(out, a, length) {
    var x = a[0],
        y = a[1],
        s = length * vec2.invLengthValues(x, y);

    out[0] = x * s;
    out[1] = y * s;

    return out;
};

vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        invlsq = vec2.invLengthValues(x, y);

    out[0] = x * invlsq;
    out[1] = y * invlsq;

    return out;
};

vec2.inverse = function(out, a) {

    out[0] = a[0] * -1;
    out[1] = a[1] * -1;

    return out;
};

vec2.lerp = function(out, a, b, x) {
    var lerp = mathf.lerp;

    out[0] = lerp(a[0], b[0], x);
    out[1] = lerp(a[1], b[1], x);

    return out;
};

vec2.perp = function(out, a) {

    out[0] = a[1];
    out[1] = -a[0];

    return out;
};

vec2.perpR = function(out, a) {

    out[0] = -a[1];
    out[1] = a[0];

    return out;
};

vec2.min = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        bx = b[0],
        by = b[1];

    out[0] = bx < ax ? bx : ax;
    out[1] = by < ay ? by : ay;

    return out;
};

vec2.max = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        bx = b[0],
        by = b[1];

    out[0] = bx > ax ? bx : ax;
    out[1] = by > ay ? by : ay;

    return out;
};

vec2.clamp = function(out, a, min, max) {
    var x = a[0],
        y = a[1],
        minx = min[0],
        miny = min[1],
        maxx = max[0],
        maxy = max[1];

    out[0] = x < minx ? minx : x > maxx ? maxx : x;
    out[1] = y < miny ? miny : y > maxy ? maxy : y;

    return out;
};

vec2.transformAngle = function(out, a, angle) {
    var x = a[0],
        y = a[1],
        c = mathf.cos(angle),
        s = mathf.sin(angle);

    out[0] = x * c - y * s;
    out[1] = x * s + y * c;

    return out;
};

vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];

    out[0] = x * m[0] + y * m[2];
    out[1] = x * m[1] + y * m[3];

    return out;
};

vec2.transformMat32 = function(out, a, m) {
    var x = a[0],
        y = a[1];

    out[0] = x * m[0] + y * m[2] + m[4];
    out[1] = x * m[1] + y * m[3] + m[5];

    return out;
};

vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];

    out[0] = x * m[0] + y * m[3] + m[6];
    out[1] = x * m[1] + y * m[4] + m[7];

    return out;
};

vec2.transformMat4 = function(out, a, m) {
    var x = a[0],
        y = a[1];

    out[0] = x * m[0] + y * m[4] + m[12];
    out[1] = x * m[1] + y * m[5] + m[13];

    return out;
};

vec2.transformProjection = function(out, a, m) {
    var x = a[0],
        y = a[1],
        d = x * m[3] + y * m[7] + m[11] + m[15];

    d = d !== 0 ? 1 / d : d;

    out[0] = (x * m[0] + y * m[4] + m[12]) * d;
    out[1] = (x * m[1] + y * m[5] + m[13]) * d;

    return out;
};

vec2.positionFromMat32 = function(out, m) {

    out[0] = m[4];
    out[1] = m[5];

    return out;
};

vec2.positionFromMat4 = function(out, m) {

    out[0] = m[12];
    out[1] = m[13];

    return out;
};

vec2.scaleFromMat2 = function(out, m) {

    out[0] = vec2.lengthValues(m[0], m[2]);
    out[1] = vec2.lengthValues(m[1], m[3]);

    return out;
};

vec2.scaleFromMat32 = vec2.scaleFromMat2;

vec2.scaleFromMat3 = function(out, m) {

    out[0] = vec2.lengthValues(m[0], m[3]);
    out[1] = vec2.lengthValues(m[1], m[4]);

    return out;
};

vec2.scaleFromMat4 = function(out, m) {

    out[0] = vec2.lengthValues(m[0], m[4]);
    out[1] = vec2.lengthValues(m[1], m[5]);

    return out;
};

vec2.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1]
    );
};

vec2.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1]
    );
};

vec2.str = function(out) {

    return "Vec2(" + out[0] + ", " + out[1] + ")";
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    Uniform = require(60);


var NativeInt32Array = typeof(Int32Array) !== "undefined" ? Int32Array : Array;


module.exports = Uniform3i;


function Uniform3i(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec3.create(NaN, NaN, NaN) : new NativeInt32Array(size * 3);
}
Uniform.extend(Uniform3i);

Uniform3i.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec3.notEqual(this.value, value)) {
            context.gl.uniform3i(this.location, value[0], value[1], value[2]);
            vec3.copy(this.value, value);
        }
    } else {
        context.gl.uniform3iv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var vec4 = require(67),
    Uniform = require(60);


var NativeInt32Array = typeof(Int32Array) !== "undefined" ? Int32Array : Array;


module.exports = Uniform4i;


function Uniform4i(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec4.create(NaN, NaN, NaN, NaN) : new NativeInt32Array(size * 4);
}
Uniform.extend(Uniform4i);

Uniform4i.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec4.notEqual(this.value, value)) {
            context.gl.uniform4i(this.location, value[0], value[1], value[2], value[3]);
            vec4.copy(this.value, value);
        }
    } else {
        context.gl.uniform4iv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var vec4 = exports;


vec4.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


vec4.create = function(x, y, z, w) {
    var out = new vec4.ArrayType(4);

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;
    out[2] = z !== undefined ? z : 0;
    out[3] = w !== undefined ? w : 1;

    return out;
};

vec4.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];

    return out;
};

vec4.clone = function(a) {
    var out = new vec4.ArrayType(4);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];

    return out;
};

vec4.set = function(out, x, y, z, w) {

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;
    out[2] = z !== undefined ? z : 0;
    out[3] = w !== undefined ? w : 0;

    return out;
};

vec4.add = function(out, a, b) {

    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];

    return out;
};

vec4.sub = function(out, a, b) {

    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];

    return out;
};

vec4.mul = function(out, a, b) {

    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];

    return out;
};

vec4.div = function(out, a, b) {
    var bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
    out[1] = a[1] * (by !== 0 ? 1 / by : by);
    out[2] = a[2] * (bz !== 0 ? 1 / bz : bz);
    out[3] = a[3] * (bw !== 0 ? 1 / bw : bw);

    return out;
};

vec4.sadd = function(out, a, s) {

    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;
    out[3] = a[3] + s;

    return out;
};

vec4.ssub = function(out, a, s) {

    out[0] = a[0] - s;
    out[1] = a[1] - s;
    out[2] = a[2] - s;
    out[3] = a[3] - s;

    return out;
};

vec4.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;

    return out;
};

vec4.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;

    return out;
};

vec4.lengthSqValues = function(x, y, z, w) {

    return x * x + y * y + z * z + w * w;
};

vec4.lengthValues = function(x, y, z, w) {
    var lsq = vec4.lengthSqValues(x, y, z, w);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec4.invLengthValues = function(x, y, z, w) {
    var lsq = vec4.lengthSqValues(x, y, z, w);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec4.dot = function(a, b) {

    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

vec4.lengthSq = function(a) {

    return vec4.dot(a, a);
};

vec4.length = function(a) {
    var lsq = vec4.lengthSq(a);

    return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
};

vec4.invLength = function(a) {
    var lsq = vec4.lengthSq(a);

    return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
};

vec4.setLength = function(out, a, length) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3],
        s = length * vec4.invLengthValues(x, y, z, w);

    out[0] = x * s;
    out[1] = y * s;
    out[2] = z * s;
    out[3] = w * s;

    return out;
};

vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3],
        lsq = vec4.invLengthValues(x, y, z, w);

    out[0] = x * lsq;
    out[1] = y * lsq;
    out[2] = z * lsq;
    out[3] = w * lsq;

    return out;
};

vec4.inverse = function(out, a) {

    out[0] = a[0] * -1;
    out[1] = a[1] * -1;
    out[2] = a[2] * -1;
    out[3] = a[3] * -1;

    return out;
};

vec4.lerp = function(out, a, b, x) {
    var lerp = mathf.lerp;

    out[0] = lerp(a[0], b[0], x);
    out[1] = lerp(a[1], b[1], x);
    out[2] = lerp(a[2], b[2], x);
    out[3] = lerp(a[3], b[3], x);

    return out;
};

vec4.min = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    out[0] = bx < ax ? bx : ax;
    out[1] = by < ay ? by : ay;
    out[2] = bz < az ? bz : az;
    out[3] = bw < aw ? bw : aw;

    return out;
};

vec4.max = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    out[0] = bx > ax ? bx : ax;
    out[1] = by > ay ? by : ay;
    out[2] = bz > az ? bz : az;
    out[3] = bw > aw ? bw : aw;

    return out;
};

vec4.clamp = function(out, a, min, max) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3],
        minx = min[0],
        miny = min[1],
        minz = min[2],
        minw = min[3],
        maxx = max[0],
        maxy = max[1],
        maxz = max[2],
        maxw = max[3];

    out[0] = x < minx ? minx : x > maxx ? maxx : x;
    out[1] = y < miny ? miny : y > maxy ? maxy : y;
    out[2] = z < minz ? minz : z > maxz ? maxz : z;
    out[3] = w < minw ? minw : w > maxw ? maxw : w;

    return out;
};

vec4.transformMat4 = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];

    out[0] = x * m[0] + y * m[4] + z * m[8] + w * m[12];
    out[1] = x * m[1] + y * m[5] + z * m[9] + w * m[13];
    out[2] = x * m[2] + y * m[6] + z * m[10] + w * m[14];
    out[3] = x * m[3] + y * m[7] + z * m[11] + w * m[15];

    return out;
};

vec4.transformProjection = function(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3],
        d = x * m[3] + y * m[7] + z * m[11] + w * m[15];

    d = d !== 0 ? 1 / d : d;

    out[0] = (x * m[0] + y * m[4] + z * m[8] + w * m[12]) * d;
    out[1] = (x * m[1] + y * m[5] + z * m[9] + w * m[13]) * d;
    out[2] = (x * m[2] + y * m[6] + z * m[10] + w * m[14]) * d;
    out[3] = (x * m[3] + y * m[7] + z * m[11] + w * m[15]) * d;

    return out;
};

vec4.positionFromMat4 = function(out, m) {

    out[0] = m[12];
    out[1] = m[13];
    out[2] = m[14];
    out[3] = m[15];

    return out;
};

vec4.scaleFromMat4 = function(out, m) {

    out[0] = vec4.lengthValues(m[0], m[4], m[8], m[12]);
    out[1] = vec4.lengthValues(m[1], m[5], m[9], m[13]);
    out[2] = vec4.lengthValues(m[2], m[6], m[10], m[14]);
    out[3] = vec4.lengthValues(m[3], m[7], m[11], m[15]);

    return out;
};

vec4.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3]
    );
};

vec4.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3]
    );
};

vec4.str = function(out) {

    return "Vec4(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
};


},
function(require, exports, module, global) {

var vec2 = require(64),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = Uniform2f;


function Uniform2f(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec2.create(NaN, NaN) : new NativeFloat32Array(size * 2);
}
Uniform.extend(Uniform2f);

Uniform2f.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec2.notEqual(this.value, value)) {
            context.gl.uniform2f(this.location, value[0], value[1]);
            vec2.copy(this.value, value);
        }
    } else {
        context.gl.uniform2fv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = Uniform3f;


function Uniform3f(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec3.create(NaN, NaN, NaN) : new NativeFloat32Array(size * 3);
}
Uniform.extend(Uniform3f);

Uniform3f.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec3.notEqual(this.value, value)) {
            context.gl.uniform3f(this.location, value[0], value[1], value[2]);
            vec3.copy(this.value, value);
        }
    } else {
        context.gl.uniform3fv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var vec4 = require(67),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = Uniform4f;


function Uniform4f(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? vec4.create(NaN, NaN, NaN, NaN) : new NativeFloat32Array(size * 4);
}
Uniform.extend(Uniform4f);

Uniform4f.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || vec4.notEqual(this.value, value)) {
            context.gl.uniform4f(this.location, value[0], value[1], value[2], value[3]);
            vec4.copy(this.value, value);
        }
    } else {
        context.gl.uniform4fv(this.location, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mat2 = require(72),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = UniformMatrix2fv;


function UniformMatrix2fv(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? mat2.create(NaN, NaN, NaN, NaN) : new NativeFloat32Array(size * 4);
}
Uniform.extend(UniformMatrix2fv);

UniformMatrix2fv.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || mat2.notEqual(this.value, value)) {
            context.gl.uniformMatrix2fv(this.location, false, value);
            mat2.copy(this.value, value);
        }
    } else {
        context.gl.uniformMatrix2fv(this.location, false, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var mat2 = exports;


mat2.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


mat2.create = function(m11, m12, m21, m22) {
    var out = new mat2.ArrayType(4);

    out[0] = m11 !== undefined ? m11 : 1;
    out[2] = m12 !== undefined ? m12 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[3] = m22 !== undefined ? m22 : 1;

    return out;
};

mat2.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];

    return out;
};

mat2.clone = function(a) {
    var out = new mat2.ArrayType(4);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];

    return out;
};

mat2.set = function(out, m11, m12, m21, m22) {

    out[0] = m11 !== undefined ? m11 : 1;
    out[2] = m12 !== undefined ? m12 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[3] = m22 !== undefined ? m22 : 1;

    return out;
};

mat2.identity = function(out) {

    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;

    return out;
};

mat2.zero = function(out) {

    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    return out;
};

mat2.mul = function(out, a, b) {
    var a11 = a[0],
        a12 = a[2],
        a21 = a[1],
        a22 = a[3],

        b11 = b[0],
        b12 = b[2],
        b21 = b[1],
        b22 = b[3];

    out[0] = a11 * b11 + a21 * b12;
    out[1] = a12 * b11 + a22 * b12;

    out[2] = a11 * b21 + a21 * b22;
    out[3] = a12 * b21 + a22 * b22;

    return out;
};

mat2.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;

    return out;
};

mat2.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;

    return out;
};

mat2.determinant = function(a) {

    return a[0] * a[3] - a[2] * a[1];
};

mat2.inverse = function(out, a) {
    var m11 = a[0],
        m12 = a[2],
        m21 = a[1],
        m22 = a[3],

        det = m11 * m22 - m12 * m21;

    if (det === 0) {
        return mat2.identity(out);
    }
    det = 1 / det;

    out[0] = m22 * det;
    out[1] = -m12 * det;
    out[2] = -m21 * det;
    out[3] = m11 * det;

    return out;
};

mat2.transpose = function(out, a) {
    var tmp;

    if (out === a) {
        tmp = a[1];
        out[1] = a[2];
        out[2] = tmp;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }

    return out;
};

mat2.setRotation = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;

    return out;
};

mat2.getRotation = function(out) {

    return mathf.atan2(out[1], out[0]);
};

mat2.rotate = function(out, a, angle) {
    var m11 = a[0],
        m12 = a[2],
        m21 = a[1],
        m22 = a[3],

        s = mathf.sin(angle),
        c = mathf.sin(angle);

    out[0] = m11 * c + m12 * s;
    out[1] = m11 * -s + m12 * c;
    out[2] = m21 * c + m22 * s;
    out[3] = m21 * -s + m22 * c;

    return out;
};

mat2.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3]
    );
};

mat2.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3]
    );
};

mat2.str = function(out) {
    return (
        "Mat2[" + out[0] + ", " + out[2] + "]\n" +
        "     [" + out[1] + ", " + out[3] + "]"
    );
};


},
function(require, exports, module, global) {

var mat3 = require(74),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = UniformMatrix3fv;


function UniformMatrix3fv(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? mat3.create(
        NaN, NaN, NaN,
        NaN, NaN, NaN,
        NaN, NaN, NaN
    ) : new NativeFloat32Array(size * 9);
}
Uniform.extend(UniformMatrix3fv);

UniformMatrix3fv.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || mat3.notEqual(this.value, value)) {
            context.gl.uniformMatrix3fv(this.location, false, value);
            mat3.copy(this.value, value);
        }
    } else {
        context.gl.uniformMatrix3fv(this.location, false, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var mat3 = exports;


mat3.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


mat3.create = function(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
    var out = new mat3.ArrayType(9);

    out[0] = m11 !== undefined ? m11 : 1;
    out[1] = m21 !== undefined ? m21 : 0;
    out[2] = m31 !== undefined ? m31 : 0;
    out[3] = m12 !== undefined ? m12 : 0;
    out[4] = m22 !== undefined ? m22 : 1;
    out[5] = m32 !== undefined ? m32 : 0;
    out[6] = m13 !== undefined ? m13 : 0;
    out[7] = m23 !== undefined ? m23 : 0;
    out[8] = m33 !== undefined ? m33 : 1;

    return out;
};

mat3.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];

    return out;
};

mat3.clone = function(a) {
    var out = new mat3.ArrayType(9);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];

    return out;
};

mat3.set = function(out, m11, m12, m13, m21, m22, m23, m31, m32, m33) {

    out[0] = m11 !== undefined ? m11 : 1;
    out[1] = m21 !== undefined ? m21 : 0;
    out[2] = m31 !== undefined ? m31 : 0;
    out[3] = m12 !== undefined ? m12 : 0;
    out[4] = m22 !== undefined ? m22 : 1;
    out[5] = m32 !== undefined ? m32 : 0;
    out[6] = m13 !== undefined ? m13 : 0;
    out[7] = m23 !== undefined ? m23 : 0;
    out[8] = m33 !== undefined ? m33 : 1;

    return out;
};

mat3.identity = function(out) {

    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;

    return out;
};

mat3.zero = function(out) {

    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;

    return out;
};

mat3.mul = function(out, a, b) {
    var a11 = a[0],
        a12 = a[3],
        a13 = a[6],
        a21 = a[1],
        a22 = a[4],
        a23 = a[7],
        a31 = a[2],
        a32 = a[5],
        a33 = a[8],

        b11 = b[0],
        b12 = b[3],
        b13 = b[6],
        b21 = b[1],
        b22 = b[4],
        b23 = b[7],
        b31 = b[2],
        b32 = b[5],
        b33 = b[8];

    out[0] = a11 * b11 + a21 * b12 + a31 * b13;
    out[3] = a12 * b11 + a22 * b12 + a32 * b13;
    out[6] = a13 * b11 + a23 * b12 + a33 * b13;

    out[1] = a11 * b21 + a21 * b22 + a31 * b23;
    out[4] = a12 * b21 + a22 * b22 + a32 * b23;
    out[7] = a13 * b21 + a23 * b22 + a33 * b23;

    out[2] = a11 * b31 + a21 * b32 + a31 * b33;
    out[5] = a12 * b31 + a22 * b32 + a32 * b33;
    out[8] = a13 * b31 + a23 * b32 + a33 * b33;

    return out;
};

mat3.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;
    out[6] = a[6] * s;
    out[7] = a[7] * s;
    out[8] = a[8] * s;

    return out;
};

mat3.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;
    out[6] = a[6] * s;
    out[7] = a[7] * s;
    out[8] = a[8] * s;

    return out;
};

mat3.determinant = function(out) {
    var a = out[0],
        b = out[1],
        c = out[2],
        d = out[3],
        e = out[4],
        f = out[5],
        g = out[6],
        h = out[7],
        i = out[8];

    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
};

mat3.inverseMat = function(out, m11, m12, m13, m21, m22, m23, m31, m32, m33) {
    var m0 = m22 * m33 - m23 * m32,
        m3 = m13 * m32 - m12 * m33,
        m6 = m12 * m23 - m13 * m22,

        det = m11 * m0 + m21 * m3 + m31 * m6;

    if (det === 0) {
        return mat3.identity(out);
    }
    det = 1 / det;

    out[0] = m0 * det;
    out[1] = (m23 * m31 - m21 * m33) * det;
    out[2] = (m21 * m32 - m22 * m31) * det;

    out[3] = m3 * det;
    out[4] = (m11 * m33 - m13 * m31) * det;
    out[5] = (m12 * m31 - m11 * m32) * det;

    out[6] = m6 * det;
    out[7] = (m13 * m21 - m11 * m23) * det;
    out[8] = (m11 * m22 - m12 * m21) * det;

    return out;
};

mat3.inverse = function(out, a) {
    return mat3.inverseMat(
        out,
        a[0], a[3], a[6],
        a[1], a[4], a[7],
        a[2], a[5], a[8]
    );
};

mat3.inverseMat4 = function(out, a) {
    return mat3.inverseMat(
        out,
        a[0], a[4], a[8],
        a[1], a[5], a[9],
        a[2], a[6], a[10]
    );
};

mat3.transpose = function(out, a) {
    var a01, a02, a12;

    if (out === a) {
        a01 = a[1];
        a02 = a[2];
        a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }

    return out;
};

mat3.scale = function(out, a, v) {
    var x = v[0],
        y = v[1],
        z = v[2];

    out[0] *= x;
    out[3] *= y;
    out[6] *= z;
    out[1] *= x;
    out[4] *= y;
    out[7] *= z;
    out[2] *= x;
    out[5] *= y;
    out[8] *= z;

    return out;
};

mat3.makeScale = function(out, v) {

    return mat3.set(
        out,
        v[0], 0, 0,
        0, v[1], 0,
        0, 0, v[2]
    );
};

mat3.makeRotationX = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat3.set(
        out,
        1, 0, 0,
        0, c, -s,
        0, s, c
    );
};

mat3.makeRotationY = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat3.set(
        out,
        c, 0, s,
        0, 1, 0, -s, 0, c
    );
};

mat3.makeRotationZ = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat3.set(
        out,
        c, -s, 0,
        s, c, 0,
        0, 0, 1
    );
};

mat3.fromQuat = function(out, q) {
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,
        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;

    out[3] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[5] = yz + wx;

    out[6] = xz + wy;
    out[7] = yz - wx;
    out[8] = 1 - (xx + yy);

    return out;
};

mat3.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5] ||
        a[6] !== b[6] ||
        a[7] !== b[7] ||
        a[8] !== b[8]
    );
};

mat3.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5] ||
        a[6] !== b[6] ||
        a[7] !== b[7] ||
        a[8] !== b[8]
    );
};

mat3.str = function(out) {
    return (
        "Mat3[" + out[0] + ", " + out[3] + ", " + out[6] + "]\n" +
        "     [" + out[1] + ", " + out[4] + ", " + out[7] + "]\n" +
        "     [" + out[2] + ", " + out[5] + ", " + out[8] + "]"
    );
};


},
function(require, exports, module, global) {

var mat4 = require(76),
    Uniform = require(60);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = UniformMatrix4fv;


function UniformMatrix4fv(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
    this.value = size === 1 ? mat4.create(
        NaN, NaN, NaN, NaN,
        NaN, NaN, NaN, NaN,
        NaN, NaN, NaN, NaN,
        NaN, NaN, NaN, NaN
    ) : new NativeFloat32Array(size * 16);
}
Uniform.extend(UniformMatrix4fv);

UniformMatrix4fv.prototype.set = function(value, force) {
    var context = this.context;

    if (this.size === 1) {
        if (force || context.__programForce || mat4.notEqual(this.value, value)) {
            context.gl.uniformMatrix4fv(this.location, false, value);
            mat4.copy(this.value, value);
        }
    } else {
        context.gl.uniformMatrix4fv(this.location, false, value);
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32),
    vec3 = require(36);


var mat4 = exports;


mat4.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


mat4.create = function(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
    var out = new mat4.ArrayType(16);

    out[0] = m11 !== undefined ? m11 : 1;
    out[4] = m12 !== undefined ? m12 : 0;
    out[8] = m13 !== undefined ? m13 : 0;
    out[12] = m14 !== undefined ? m14 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[5] = m22 !== undefined ? m22 : 1;
    out[9] = m23 !== undefined ? m23 : 0;
    out[13] = m24 !== undefined ? m24 : 0;
    out[2] = m31 !== undefined ? m31 : 0;
    out[6] = m32 !== undefined ? m32 : 0;
    out[10] = m33 !== undefined ? m33 : 1;
    out[14] = m34 !== undefined ? m34 : 0;
    out[3] = m41 !== undefined ? m41 : 0;
    out[7] = m42 !== undefined ? m42 : 0;
    out[11] = m43 !== undefined ? m43 : 0;
    out[15] = m44 !== undefined ? m44 : 1;

    return out;
};

mat4.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];

    return out;
};

mat4.clone = function(a) {
    var out = new mat4.ArrayType(16);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];

    return out;
};

mat4.set = function(out, m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {

    out[0] = m11 !== undefined ? m11 : 1;
    out[4] = m12 !== undefined ? m12 : 0;
    out[8] = m13 !== undefined ? m13 : 0;
    out[12] = m14 !== undefined ? m14 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[5] = m22 !== undefined ? m22 : 1;
    out[9] = m23 !== undefined ? m23 : 0;
    out[13] = m24 !== undefined ? m24 : 0;
    out[2] = m31 !== undefined ? m31 : 0;
    out[6] = m32 !== undefined ? m32 : 0;
    out[10] = m33 !== undefined ? m33 : 1;
    out[14] = m34 !== undefined ? m34 : 0;
    out[3] = m41 !== undefined ? m41 : 0;
    out[7] = m42 !== undefined ? m42 : 0;
    out[11] = m43 !== undefined ? m43 : 0;
    out[15] = m44 !== undefined ? m44 : 1;

    return out;
};

mat4.identity = function(out) {

    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

mat4.zero = function(out) {

    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 0;

    return out;
};

mat4.mul = function(out, a, b) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11],
        a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15],
        b0, b1, b2, b3;

    b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return out;
};

mat4.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;
    out[6] = a[6] * s;
    out[7] = a[7] * s;
    out[8] = a[8] * s;
    out[9] = a[9] * s;
    out[10] = a[10] * s;
    out[11] = a[11] * s;
    out[12] = a[12] * s;
    out[13] = a[13] * s;
    out[14] = a[14] * s;
    out[15] = a[15] * s;

    return out;
};

mat4.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;
    out[6] = a[6] * s;
    out[7] = a[7] * s;
    out[8] = a[8] * s;
    out[9] = a[9] * s;
    out[10] = a[10] * s;
    out[11] = a[11] * s;
    out[12] = a[12] * s;
    out[13] = a[13] * s;
    out[14] = a[14] * s;
    out[15] = a[15] * s;

    return out;
};

mat4.determinant = function(a) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11],
        a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

mat4.inverse = function(out, a) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11],
        a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return mat4.identity(out);
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

mat4.transpose = function(out, a) {
    var a01, a02, a03, a12, a13, a23;

    if (out === a) {
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a12 = a[6];
        a13 = a[7];
        a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }

    return out;
};

var lookAt_x = vec3.create(),
    lookAt_y = vec3.create(),
    lookAt_z = vec3.create();

mat4.lookAt = function(out, eye, target, up) {
    var x = lookAt_x,
        y = lookAt_y,
        z = lookAt_z;

    vec3.sub(z, eye, target);
    vec3.normalize(z, z);

    if (vec3.length(z) === 0) {
        z[2] = 1;
    }

    vec3.cross(x, up, z);
    vec3.normalize(x, x);

    if (vec3.length(x) === 0) {
        z[0] += mathf.EPSILON;
        vec3.cross(x, up, z);
        vec3.normalize(x, x);
    }

    vec3.cross(y, z, x);

    out[0] = x[0];
    out[4] = y[0];
    out[8] = z[0];
    out[1] = x[1];
    out[5] = y[1];
    out[9] = z[1];
    out[2] = x[2];
    out[6] = y[2];
    out[10] = z[2];

    return out;
};

mat4.compose = function(out, position, scale, rotation) {
    var x = rotation[0],
        y = rotation[1],
        z = rotation[2],
        w = rotation[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,
        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2,

        sx = scale[0],
        sy = scale[1],
        sz = scale[2];

    out[0] = (1 - (yy + zz)) * sx;
    out[4] = (xy - wz) * sy;
    out[8] = (xz + wy) * sz;

    out[1] = (xy + wz) * sx;
    out[5] = (1 - (xx + zz)) * sy;
    out[9] = (yz - wx) * sz;

    out[2] = (xz - wy) * sx;
    out[6] = (yz + wx) * sy;
    out[10] = (1 - (xx + yy)) * sz;

    out[3] = 0;
    out[7] = 0;
    out[11] = 0;

    out[12] = position[0];
    out[13] = position[1];
    out[14] = position[2];
    out[15] = 1;

    return out;
};

mat4.decompose = function(out, position, scale, rotation) {
    var m11 = out[0],
        m12 = out[4],
        m13 = out[8],
        m21 = out[1],
        m22 = out[5],
        m23 = out[9],
        m31 = out[2],
        m32 = out[6],
        m33 = out[10],
        x = 0,
        y = 0,
        z = 0,
        w = 1,

        sx = vec3.lengthValues(m11, m21, m31),
        sy = vec3.lengthValues(m12, m22, m32),
        sz = vec3.lengthValues(m13, m23, m33),

        invSx = 1 / sx,
        invSy = 1 / sy,
        invSz = 1 / sz,

        s, trace;

    scale[0] = sx;
    scale[1] = sy;
    scale[2] = sz;

    position[0] = out[12];
    position[1] = out[13];
    position[2] = out[14];

    m11 *= invSx;
    m12 *= invSy;
    m13 *= invSz;
    m21 *= invSx;
    m22 *= invSy;
    m23 *= invSz;
    m31 *= invSx;
    m32 *= invSy;
    m33 *= invSz;

    trace = m11 + m22 + m33;

    if (trace > 0) {
        s = 0.5 / mathf.sqrt(trace + 1);

        w = 0.25 / s;
        x = (m32 - m23) * s;
        y = (m13 - m31) * s;
        z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        s = 2 * mathf.sqrt(1 + m11 - m22 - m33);

        w = (m32 - m23) / s;
        x = 0.25 * s;
        y = (m12 + m21) / s;
        z = (m13 + m31) / s;
    } else if (m22 > m33) {
        s = 2 * mathf.sqrt(1 + m22 - m11 - m33);

        w = (m13 - m31) / s;
        x = (m12 + m21) / s;
        y = 0.25 * s;
        z = (m23 + m32) / s;
    } else {
        s = 2 * mathf.sqrt(1 + m33 - m11 - m22);

        w = (m21 - m12) / s;
        x = (m13 + m31) / s;
        y = (m23 + m32) / s;
        z = 0.25 * s;
    }

    rotation[0] = x;
    rotation[1] = y;
    rotation[2] = w;
    rotation[3] = z;

    return out;
};

mat4.setPosition = function(out, v) {
    var z = v[2];

    out[12] = v[0];
    out[13] = v[1];
    out[14] = z !== undefined ? z : 0;

    return out;
};

mat4.extractPosition = function(out, a) {

    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];

    return out;
};

mat4.extractRotation = function(out, a) {
    var lx = vec3.lengthSqValues(a[0], a[1], a[2]),
        ly = vec3.lengthSqValues(a[4], a[5], a[6]),
        lz = vec3.lengthSqValues(a[8], a[9], a[10]),

        scaleX = lx !== 0 ? 1 / mathf.sqrt(lx) : lx,
        scaleY = ly !== 0 ? 1 / mathf.sqrt(ly) : ly,
        scaleZ = lz !== 0 ? 1 / mathf.sqrt(lz) : lz;

    out[0] = a[0] * scaleX;
    out[1] = a[1] * scaleX;
    out[2] = a[2] * scaleX;

    out[4] = a[4] * scaleY;
    out[5] = a[5] * scaleY;
    out[6] = a[6] * scaleY;

    out[8] = a[8] * scaleZ;
    out[9] = a[9] * scaleZ;
    out[10] = a[10] * scaleZ;

    return out;
};

mat4.extractRotationScale = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];

    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];

    return out;
};

mat4.translate = function(out, a, v) {
    var x = v[0],
        y = v[1],
        z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];

        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

mat4.scale = function(out, a, v) {
    var x = v[0],
        y = v[1],
        z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];

    return out;
};

mat4.rotateX = function(out, a, angle) {
    var s = Math.sin(angle),
        c = Math.cos(angle),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;

    return out;
};

mat4.rotateY = function(out, a, angle) {
    var s = mathf.sin(angle),
        c = mathf.cos(angle),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) {
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;

    return out;
};

mat4.rotateZ = function(out, a, angle) {
    var s = mathf.sin(angle),
        c = mathf.cos(angle),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) {
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;

    return out;
};

mat4.makeTranslation = function(out, v) {

    return mat4.set(
        out,
        1, 0, 0, v[0],
        0, 1, 0, v[1],
        0, 0, 1, v[2],
        0, 0, 0, 1
    );
};

mat4.makeScale = function(out, v) {

    return mat4.set(
        out,
        v[0], 0, 0, 0,
        0, v[1], 0, 0,
        0, 0, v[2], 0,
        0, 0, 0, 1
    );
};

mat4.makeRotationX = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat4.set(
        out,
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    );
};

mat4.makeRotationY = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat4.set(
        out,
        c, 0, s, 0,
        0, 1, 0, 0, -s, 0, c, 0,
        0, 0, 0, 1
    );
};

mat4.makeRotationZ = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    return mat4.set(
        out,
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
};

mat4.fromQuat = function(out, q) {
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,
        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[4] = xy - wz;
    out[8] = xz + wy;

    out[1] = xy + wz;
    out[5] = 1 - (xx + zz);
    out[9] = yz - wx;

    out[2] = xz - wy;
    out[6] = yz + wx;
    out[10] = 1 - (xx + yy);

    out[3] = 0;
    out[7] = 0;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

mat4.frustum = function(out, left, right, top, bottom, near, far) {
    var x = 2 * near / (right - left),
        y = 2 * near / (top - bottom),

        a = (right + left) / (right - left),
        b = (top + bottom) / (top - bottom),
        c = -(far + near) / (far - near),
        d = -2 * far * near / (far - near);

    out[0] = x;
    out[4] = 0;
    out[8] = a;
    out[12] = 0;
    out[1] = 0;
    out[5] = y;
    out[9] = b;
    out[13] = 0;
    out[2] = 0;
    out[6] = 0;
    out[10] = c;
    out[14] = d;
    out[3] = 0;
    out[7] = 0;
    out[11] = -1;
    out[15] = 0;

    return out;
};

mat4.perspective = function(out, fov, aspect, near, far) {
    var ymax = near * mathf.tan(fov * 0.5),
        ymin = -ymax,
        xmin = ymin * aspect,
        xmax = ymax * aspect;

    return mat4.frustum(out, xmin, xmax, ymax, ymin, near, far);
};

mat4.orthographic = function(out, left, right, top, bottom, near, far) {
    var w = right - left,
        h = top - bottom,
        p = far - near,

        x = (right + left) / w,
        y = (top + bottom) / h,
        z = (far + near) / p;

    out[0] = 2 / w;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 2 / h;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = -2 / p;
    out[11] = 0;
    out[12] = -x;
    out[13] = -y;
    out[14] = -z;
    out[15] = 1;

    return out;
};

mat4.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5] ||
        a[6] !== b[6] ||
        a[7] !== b[7] ||
        a[8] !== b[8] ||
        a[9] !== b[9] ||
        a[10] !== b[10] ||
        a[11] !== b[11] ||
        a[12] !== b[12] ||
        a[13] !== b[13] ||
        a[14] !== b[14] ||
        a[15] !== b[15]
    );
};

mat4.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5] ||
        a[6] !== b[6] ||
        a[7] !== b[7] ||
        a[8] !== b[8] ||
        a[9] !== b[9] ||
        a[10] !== b[10] ||
        a[11] !== b[11] ||
        a[12] !== b[12] ||
        a[13] !== b[13] ||
        a[14] !== b[14] ||
        a[15] !== b[15]
    );
};

mat4.str = function(out) {
    return (
        "Mat4[" + out[0] + ", " + out[4] + ", " + out[8] + ", " + out[12] + "]\n" +
        "     [" + out[1] + ", " + out[5] + ", " + out[9] + ", " + out[13] + "]\n" +
        "     [" + out[2] + ", " + out[6] + ", " + out[10] + ", " + out[14] + "]\n" +
        "     [" + out[3] + ", " + out[7] + ", " + out[11] + ", " + out[15] + "]"
    );
};


},
function(require, exports, module, global) {

var Uniform = require(60);


module.exports = UniformTexture;


function UniformTexture(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
}
Uniform.extend(UniformTexture);

UniformTexture.prototype.set = function(value, force) {
    this.context.setTexture(this.location, value, force);
    return this;
};


},
function(require, exports, module, global) {

var Uniform = require(60);


module.exports = UniformTextureCube;


function UniformTextureCube(context, name, location, size) {
    Uniform.call(this, context, name, location, size);
}
Uniform.extend(UniformTextureCube);

UniformTextureCube.prototype.set = function(value, force) {
    this.context.setTexture(this.location, value, force);
    return this;
};


},
function(require, exports, module, global) {

module.exports = {
    INT: require(80),
    FLOAT: require(82),

    INT_VEC2: require(83),
    INT_VEC3: require(84),
    INT_VEC4: require(85),

    FLOAT_VEC2: require(86),
    FLOAT_VEC3: require(87),
    FLOAT_VEC4: require(88)
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute1i;


function Attribute1i(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute1i);

Attribute1i.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 1, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var inherits = require(11);


module.exports = Attribute;


function Attribute(context, name, location) {
    this.name = name;
    this.location = location;
    this.context = context;
}

Attribute.extend = function(child) {
    return inherits(child, this);
};

Attribute.prototype.set = function( /* buffer, offset, force */ ) {
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute1f;


function Attribute1f(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute1f);

Attribute1f.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 1, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute2i;


function Attribute2i(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute2i);

Attribute2i.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 2, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute3i;


function Attribute3i(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute3i);

Attribute3i.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 3, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute4i;


function Attribute4i(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute4i);

Attribute4i.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 4, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute2f;


function Attribute2f(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute2f);

Attribute2f.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 2, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute3f;


function Attribute3f(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute3f);

Attribute3f.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 3, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var Attribute = require(81);


module.exports = Attribute4f;


function Attribute4f(context, name, location) {
    Attribute.call(this, context, name, location);
}
Attribute.extend(Attribute4f);

Attribute4f.prototype.set = function(buffer, offset, force) {
    var context = this.context,
        gl = context.gl;

    context.setAttribPointer(this.location, 4, gl.FLOAT, buffer.stride, offset, context.setArrayBuffer(buffer) || force);
    return this;
};


},
function(require, exports, module, global) {

var enums = require(42);


var side = enums([
    "NONE",
    "FRONT",
    "BACK",
    "BOTH"
]);


module.exports = side;


},
function(require, exports, module, global) {

var enums = require(42);


var wrapMode = enums([
    "ONCE",
    "LOOP",
    "PING_PONG",
    "CLAMP"
]);


module.exports = wrapMode;


},
function(require, exports, module, global) {

var isString = require(18),
    isNumber = require(34),
    indexOf = require(57),
    Class = require(9),
    Assets = require(92),
    createLoop = require(26),
    Scene = require(93);


var ClassPrototype = Class.prototype,
    BaseApplicationPrototype;


module.exports = BaseApplication;


function BaseApplication() {
    var _this = this;

    Class.call(this);

    this.assets = Assets.create();

    this.__scenes = [];
    this.__sceneHash = {};

    this.__loop = createLoop(function loop() {
        _this.loop();
    }, null);

}
Class.extend(BaseApplication, "odin.BaseApplication");
BaseApplicationPrototype = BaseApplication.prototype;

BaseApplicationPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

BaseApplicationPrototype.destructor = function() {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash,
        i = -1,
        il = scenes.length - 1,
        scene;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        scene = scenes[i];
        scene.destructor();
        delete sceneHash[scene.name];
        scenes.splice(i, 1);
    }

    this.assets.destructor();
    this.__loop.pause();

    return this;
};

BaseApplicationPrototype.init = function() {

    this.__loop.run();
    this.emit("init");

    return this;
};

BaseApplicationPrototype.pause = function() {

    this.__loop.pause();
    this.emit("pause");

    return this;
};

BaseApplicationPrototype.resume = function() {

    this.__loop.run();
    this.emit("resume");

    return this;
};

BaseApplicationPrototype.isRunning = function() {
    return this.__loop.isRunning();
};

BaseApplicationPrototype.isPaused = function() {
    return this.__loop.isPaused();
};

BaseApplicationPrototype.loop = function() {

    this.emit("loop");

    return this;
};

BaseApplicationPrototype.addScene = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        BaseApplication_addScene(this, arguments[i]);
    }
    return this;
};

function BaseApplication_addScene(_this, scene) {
    var scenes = _this.__scenes,
        sceneHash = _this.__sceneHash,
        name = scene.name,
        json;

    if (!sceneHash[name]) {
        json = (scene instanceof Scene) ? scene.toJSON() : scene;

        sceneHash[name] = json;
        scenes[scenes.length] = json;

        _this.emit("addScene", name);
    } else {
        throw new Error("Application addScene(...scenes) Scene is already a member of Application");
    }
}

BaseApplicationPrototype.removeScene = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        BaseApplication_removeScene(this, arguments[i]);
    }
    return this;
};

function BaseApplication_removeScene(_this, scene) {
    var scenes = _this.__scenes,
        sceneHash = _this.__sceneHash,
        json, name;

    if (isString(scene)) {
        json = sceneHash[scene];
    } else if (isNumber(scene)) {
        json = scenes[scene];
    }

    name = json.name;

    if (sceneHash[name]) {

        sceneHash[name] = null;
        scenes.splice(indexOf(scenes, json), 1);

        _this.emit("removeScene", name);
    } else {
        throw new Error("Application removeScene(...scenes) Scene not a member of Application");
    }
}


},
function(require, exports, module, global) {

var Class = require(9),
    indexOf = require(57);


var ClassPrototype = Class.prototype,
    AssetsPrototype;


module.exports = Assets;


function Assets() {

    Class.call(this);

    this.__notLoaded = [];
    this.__array = [];
    this.__hash = {};
}
Class.extend(Assets, "odin.Assets");
AssetsPrototype = Assets.prototype;

AssetsPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

AssetsPrototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = -1,
        il = array.length - 1,
        asset;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        asset = array[i];
        asset.destructor();

        array.splice(i, 1);
        delete hash[asset.name];
    }

    this.__notLoaded.length = 0;

    return this;
};

AssetsPrototype.has = function(name) {
    return !!this.__hash[name];
};

AssetsPrototype.get = function(name) {
    return this.__hash[name];
};

AssetsPrototype.addAsset = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_addAsset(this, arguments[i]);
    }

    return this;
};

function Assets_addAsset(_this, asset) {
    var name = asset.name,
        hash = _this.__hash,
        notLoaded = _this.__notLoaded,
        array = _this.__array;

    if (!hash[name]) {
        hash[name] = asset;
        array[array.length] = asset;

        if (asset.src != null) {
            notLoaded[notLoaded.length] = asset;
        }
    } else {
        throw new Error("Assets addAsset(...assets) Assets already has member named " + name);
    }
}

AssetsPrototype.removeAsset = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_removeAsset(this, arguments[i]);
    }

    return this;
};

function Assets_removeAsset(_this, asset) {
    var name = asset.name,
        hash = _this.__hash,
        notLoaded = _this.__notLoaded,
        array = _this.__array,
        index;

    if (hash[name]) {
        delete hash[name];
        array.splice(indexOf(array, asset), 1);

        if ((index = indexOf(notLoaded, asset))) {
            notLoaded.splice(index, 1);
        }
    } else {
        throw new Error("Assets removeAsset(...assets) Assets do not have a member named " + name);
    }
}

AssetsPrototype.load = function(callback) {
    var _this = this,
        notLoaded = this.__notLoaded,
        length = notLoaded.length,
        i, il, called, done;

    if (length === 0) {
        callback();
    } else {
        i = -1;
        il = length - 1;
        called = false;

        done = function done(err) {
            if (called) {
                return;
            }
            if (err || --length === 0) {
                called = true;
                if (callback) {
                    callback(err);
                }
                _this.emit("load");
            }
        };

        while (i++ < il) {
            notLoaded[i].load(done);
        }
        notLoaded.length = 0;
    }

    return this;
};


},
function(require, exports, module, global) {

var indexOf = require(57),
    Input = require(94),
    Class = require(9),
    Time = require(116),
    Entity = require(117);


var ClassPrototype = Class.prototype,
    ScenePrototype;


module.exports = Scene;


function Scene() {

    Class.call(this);

    this.name = null;

    this.time = new Time();
    this.input = new Input();

    this.assets = null;
    this.application = null;

    this.__entities = [];
    this.__entityHash = {};

    this.__managers = [];
    this.managers = {};

    this.__plugins = [];
    this.plugins = {};

    this.__init = false;
    this.__awake = false;
}
Class.extend(Scene, "odin.Scene");
ScenePrototype = Scene.prototype;

ScenePrototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.time.construct();
    this.input.construct();

    this.__init = false;
    this.__awake = false;

    return this;
};

ScenePrototype.destructor = function() {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        entities[i].destroy(false).destructor();
    }

    this.name = null;
    this.input.destructor();
    this.application = null;

    this.__init = false;
    this.__awake = false;

    return this;
};

ScenePrototype.init = function(element) {

    this.__init = true;
    this.input.attach(element);
    this.sortManagers();
    this.emit("init");

    return this;
};

ScenePrototype.awake = function() {

    this.__awake = true;
    this.awakePlugins();
    this.awakeManagers();
    this.emit("awake");

    return this;
};

ScenePrototype.update = function() {
    var time = this.time;

    time.update();
    this.input.update(time.time, time.frameCount);

    this.updatePlugins();
    this.updateManagers();

    return this;
};

ScenePrototype.clear = function(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ScenePrototype.destroy = function(emitEvent) {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1;

    if (emitEvent !== false) {
        this.emit("destroy");
    }

    while (i++ < il) {
        entities[i].destroy();
    }

    this.destroyPlugins();

    return this;
};

ScenePrototype.has = function(entity) {
    return !!this.__entityHash[entity.__id];
};

ScenePrototype.find = function(name) {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1,
        entity;

    while (i++ < il) {
        entity = entities[i];

        if (entity.name === name) {
            return entity;
        }
    }

    return undefined;
};

ScenePrototype.addEntity = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_addEntity(this, arguments[i]);
    }
    return this;
};

function Scene_addEntity(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (!entityHash[id]) {
        entity.scene = _this;
        entities[entities.length] = entity;
        entityHash[id] = entity;

        Scene_addObjectComponents(_this, entity.__componentArray);
        Scene_addObjectChildren(_this, entity.children);

        _this.emit("addEntity", entity);
    } else {
        throw new Error("Scene addEntity(...entities) trying to add object that is already a member of Scene");
    }
}

function Scene_addObjectComponents(_this, components) {
    var i = -1,
        il = components.length - 1;

    while (i++ < il) {
        _this.__addComponent(components[i]);
    }
}

function Scene_addObjectChildren(_this, children) {
    var i = -1,
        il = children.length - 1;

    while (i++ < il) {
        Scene_addEntity(_this, children[i]);
    }
}

ScenePrototype.__addComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managers,
        manager = managerHash[className];

    if (!manager) {
        manager = component.Manager.create();

        manager.scene = this;
        managers[managers.length] = manager;
        managerHash[className] = manager;

        sortManagers(this);
        manager.init();

        this.emit("addManager", manager);
    }

    manager.addComponent(component);
    component.manager = manager;

    this.emit("add-" + className, component);

    if (this.__init) {
        component.init();
    }
    if (this.__awake) {
        manager.sort();
        component.awake();
    }

    return this;
};

ScenePrototype.removeEntity = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_removeEntity(this, arguments[i]);
    }
    return this;
};

function Scene_removeEntity(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (entityHash[id]) {
        _this.emit("removeEntity", entity);

        entity.scene = null;

        entities.splice(indexOf(entities, entity), 1);
        delete entityHash[id];

        Scene_removeObjectComponents(_this, entity.__componentArray);
        Scene_removeObjectChildren(_this, entity.children);
    } else {
        throw new Error("Scene removeEntity(...entities) trying to remove object that is not a member of Scene");
    }
}

function Scene_removeObjectComponents(_this, components) {
    var i = -1,
        il = components.length - 1;

    while (i++ < il) {
        _this.__removeComponent(components[i]);
    }
}

function Scene_removeObjectChildren(_this, children) {
    var i = -1,
        il = children.length - 1;

    while (i++ < il) {
        Scene_removeEntity(_this, children[i]);
    }
}

ScenePrototype.__removeComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managers,
        manager = managerHash[className];

    if (manager) {
        this.emit("remove-" + className, component);

        manager.removeComponent(component);
        component.manager = null;

        if (manager.isEmpty()) {
            manager.clear();
            this.emit("removeManager", manager);

            manager.scene = null;
            managers.splice(indexOf(managers, manager), 1);
            delete managerHash[className];
        }
    }

    if (this.__awake) {
        component.clear();
    }

    return this;
};

function sortManagers(_this) {
    _this.__managers.sort(sortManagersFn);
}

function sortManagersFn(a, b) {
    return a.order - b.order;
}

ScenePrototype.hasManager = function(name) {
    return !!this.managers[name];
};

ScenePrototype.getManager = function(name) {
    return this.managers[name];
};

function clearManagers_callback(manager) {
    manager.clear(clearManagers_callback.emitEvents);
}
clearManagers_callback.set = function set(emitEvents) {
    this.emitEvents = emitEvents;
    return this;
};
ScenePrototype.clearManagers = function clearManagers(emitEvents) {
    return this.eachManager(clearManagers_callback.set(emitEvents));
};

function initManagers_callback(manager) {
    manager.init();
}
ScenePrototype.initManagers = function initManagers() {
    return this.eachManager(initManagers_callback);
};

function sortManagers_callback(manager) {
    manager.sort();
}
ScenePrototype.sortManagers = function sortManagers() {
    return this.eachManager(sortManagers_callback);
};

function awakeManagers_callback(manager) {
    manager.awake();
}
ScenePrototype.awakeManagers = function awakeManagers() {
    return this.eachManager(awakeManagers_callback);
};

function updateManagers_callback(manager) {
    manager.update();
}
ScenePrototype.updateManagers = function updateManagers() {
    return this.eachManager(updateManagers_callback);
};

function destroyManagers_callback(manager) {
    manager.destroy();
}
ScenePrototype.destroyManagers = function destroyManagers() {
    return this.eachManager(destroyManagers_callback);
};

ScenePrototype.eachManager = function eachManager(fn) {
    var managers = this.__managers,
        i = -1,
        il = managers.length - 1;

    while (i++ < il) {
        if (fn(managers[i]) === false) {
            break;
        }
    }
    return this;
};

ScenePrototype.addPlugin = function addPlugin() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ScenePrototype_addPlugin(this, arguments[i]);
    }

    return this;
};

function ScenePrototype_addPlugin(_this, plugin) {
    var plugins = _this.__plugins,
        pluginHash = _this.plugins,
        className = plugin.className;

    if (!pluginHash[className]) {
        plugin.scene = _this;
        plugins[plugins.length] = plugin;
        pluginHash[className] = plugin;
        plugin.init();
        _this.emit("addPlugin", plugin);
    } else {
        throw new Error("Scene addPlugin(...plugins) trying to add plugin " + className + " that is already a member of Scene");
    }
}

ScenePrototype.removePlugin = function removePlugin() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ScenePrototype_removePlugin(this, arguments[i]);
    }

    return this;
};

function ScenePrototype_removePlugin(_this, plugin) {
    var plugins = _this.__plugins,
        pluginHash = _this.plugins,
        className = plugin.className;

    if (pluginHash[className]) {
        _this.emit("removePlugin", plugin);
        plugin.scene = null;
        plugins.splice(indexOf(plugins, plugin), 1);
        delete pluginHash[className];
    } else {
        throw new Error(
            "Scene removePlugin(...plugins) trying to remove plugin " + className + " that is not a member of Scene"
        );
    }
}

ScenePrototype.hasPlugin = function(name) {
    return !!this.plugins[name];
};

ScenePrototype.getPlugin = function(name) {
    return this.plugins[name];
};

function clearPlugins_callback(plugin) {
    plugin.clear(clearPlugins_callback.emitEvents);
}
clearPlugins_callback.set = function set(emitEvents) {
    this.emitEvents = emitEvents;
    return this;
};
ScenePrototype.clearPlugins = function clearPlugins(emitEvents) {
    return this.eachPlugin(clearPlugins_callback.set(emitEvents));
};

function awakePlugins_callback(plugin) {
    plugin.awake();
}
ScenePrototype.awakePlugins = function awakePlugins() {
    return this.eachPlugin(awakePlugins_callback);
};

function updatePlugins_callback(plugin) {
    plugin.update();
}
ScenePrototype.updatePlugins = function updatePlugins() {
    return this.eachPlugin(updatePlugins_callback);
};

function destroyPlugins_callback(plugin) {
    plugin.destroy();
}
ScenePrototype.destroyPlugins = function destroyPlugins() {
    return this.eachPlugin(destroyPlugins_callback);
};

ScenePrototype.eachPlugin = function eachPlugin(fn) {
    var plugins = this.__plugins,
        i = -1,
        il = plugins.length - 1;

    while (i++ < il) {
        if (fn(plugins[i]) === false) {
            break;
        }
    }
    return this;
};

ScenePrototype.toJSON = function(json) {
    var entities = this.__entities,
        plugins = this.__plugins,
        i = -1,
        il = entities.length - 1,
        index, jsonEntities, entity, jsonPlugins;

    json = ClassPrototype.toJSON.call(this, json);

    json.name = this.name;
    jsonEntities = json.entities || (json.entities = []);
    jsonPlugins = json.plugins || (json.plugins = []);

    while (i++ < il) {
        entity = entities[i];

        if (entity.depth === 0) {
            index = jsonEntities.length;
            jsonEntities[index] = entity.toJSON(jsonEntities[index]);
        }
    }

    i = -1;
    il = plugins.length - 1;
    while (i++ < il) {
        index = jsonPlugins.length;
        jsonPlugins[index] = plugins[i].toJSON(jsonPlugins[index]);
    }

    return json;
};

ScenePrototype.fromJSON = function(json) {
    var jsonEntities = json.entities,
        jsonPlugins = json.plugins,
        i = -1,
        il = jsonEntities.length - 1,
        entity, jsonPlugin, plugin;

    ClassPrototype.fromJSON.call(this, json);

    this.name = json.name;

    while (i++ < il) {
        entity = Entity.create();
        entity.scene = this;
        entity.fromJSON(jsonEntities[i]);
        this.add(entity);
    }

    i = -1;
    il = jsonPlugins.length - 1;
    while (i++ < il) {
        jsonPlugin = jsonPlugins[i];
        plugin = Class.getClass(jsonPlugin.className).create();
        plugin.scene = this;
        plugin.fromJSON(jsonPlugin);
        this.addPlugin(plugin);
    }

    return this;
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    EventEmitter = require(23),
    Handler = require(95),
    Mouse = require(108),
    Buttons = require(109),
    Touches = require(111),
    Axes = require(113),
    eventHandlers = require(115);


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


},
function(require, exports, module, global) {

var EventEmitter = require(23),
    focusNode = require(96),
    blurNode = require(97),
    getActiveElement = require(98),
    eventListener = require(2),
    events = require(100);


var HandlerPrototype;


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

    this.__handler = null;

    this.__focusHandler = null;
    this.__blurHandler = null;

    return this;
};

HandlerPrototype.attach = function(element) {
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

HandlerPrototype.detach = function() {
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


},
function(require, exports, module, global) {

var isNode = require(7);


module.exports = focusNode;


function focusNode(node) {
    if (isNode(node) && node.focus) {
        try {
            node.focus();
        } catch (e) {}
    }
}


},
function(require, exports, module, global) {

var isNode = require(7);


module.exports = blurNode;


function blurNode(node) {
    if (isNode(node) && node.blur) {
        try {
            node.blur();
        } catch (e) {}
    }
}


},
function(require, exports, module, global) {

var isDocument = require(99),
    environment = require(1);


var document = environment.document;


module.exports = getActiveElement;


function getActiveElement(ownerDocument) {
    ownerDocument = isDocument(ownerDocument) ? ownerDocument : document;

    try {
        return ownerDocument.activeElement || ownerDocument.body;
    } catch (e) {
        return ownerDocument.body;
    }
}


},
function(require, exports, module, global) {

var isNode = require(7);


module.exports = isDocument;


function isDocument(obj) {
    return isNode(obj) && obj.nodeType === 9;
}


},
function(require, exports, module, global) {

var MouseEvent = require(101),
    WheelEvent = require(103),
    KeyEvent = require(104),
    TouchEvent = require(106),
    DeviceMotionEvent = require(107);


module.exports = {
    mousedown: MouseEvent,
    mouseup: MouseEvent,
    mousemove: MouseEvent,
    mouseout: MouseEvent,

    wheel: WheelEvent,

    keyup: KeyEvent,
    keydown: KeyEvent,

    touchstart: TouchEvent,
    touchmove: TouchEvent,
    touchend: TouchEvent,
    touchcancel: TouchEvent,

    devicemotion: DeviceMotionEvent
};


},
function(require, exports, module, global) {

var createPool = require(102),
    environment = require(1);


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


},
function(require, exports, module, global) {

var isFunction = require(5),
    isNumber = require(34),
    defineProperty = require(21);


var descriptor = {
    configurable: false,
    enumerable: false,
    writable: false,
    value: null
};


module.exports = createPool;


function createPool(Constructor, poolSize) {
    addProperty(Constructor, "instancePool", []);
    addProperty(Constructor, "getPooled", createPooler(Constructor));
    addProperty(Constructor, "release", createReleaser(Constructor));

    if (!Constructor.poolSize) {
        Constructor.poolSize = isNumber(poolSize) ? (poolSize < -1 ? -1 : poolSize) : -1;
    }

    return Constructor;
}

function addProperty(object, name, value) {
    descriptor.value = value;
    defineProperty(object, name, descriptor);
    descriptor.value = null;
}

function createPooler(Constructor) {
    switch (Constructor.length) {
        case 0:
            return createNoArgumentPooler(Constructor);
        case 1:
            return createOneArgumentPooler(Constructor);
        case 2:
            return createTwoArgumentsPooler(Constructor);
        case 3:
            return createThreeArgumentsPooler(Constructor);
        case 4:
            return createFourArgumentsPooler(Constructor);
        case 5:
            return createFiveArgumentsPooler(Constructor);
        default:
            return createApplyPooler(Constructor);
    }
}

function createNoArgumentPooler(Constructor) {
    return function pooler() {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            return instance;
        } else {
            return new Constructor();
        }
    };
}

function createOneArgumentPooler(Constructor) {
    return function pooler(a0) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0);
            return instance;
        } else {
            return new Constructor(a0);
        }
    };
}

function createTwoArgumentsPooler(Constructor) {
    return function pooler(a0, a1) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1);
            return instance;
        } else {
            return new Constructor(a0, a1);
        }
    };
}

function createThreeArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2);
            return instance;
        } else {
            return new Constructor(a0, a1, a2);
        }
    };
}

function createFourArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2, a3) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2, a3);
            return instance;
        } else {
            return new Constructor(a0, a1, a2, a3);
        }
    };
}

function createFiveArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2, a3, a4) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2, a3, a4);
            return instance;
        } else {
            return new Constructor(a0, a1, a2, a3, a4);
        }
    };
}

function createApplyConstructor(Constructor) {
    function F(args) {
        return Constructor.apply(this, args);
    }
    F.prototype = Constructor.prototype;

    return function applyConstructor(args) {
        return new F(args);
    };
}

function createApplyPooler(Constructor) {
    var applyConstructor = createApplyConstructor(Constructor);

    return function pooler() {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.apply(instance, arguments);
            return instance;
        } else {
            return applyConstructor(arguments);
        }
    };
}

function createReleaser(Constructor) {
    return function releaser(instance) {
        var instancePool = Constructor.instancePool;

        if (isFunction(instance.destructor)) {
            instance.destructor();
        }
        if (Constructor.poolSize === -1 || instancePool.length < Constructor.poolSize) {
            instancePool[instancePool.length] = instance;
        }
    };
}


},
function(require, exports, module, global) {

var createPool = require(102);


var WheelEventPrototype;


module.exports = WheelEvent;


function WheelEvent(e) {
    this.type = e.type;
    this.deltaX = getDeltaX(e);
    this.deltaY = getDeltaY(e);
    this.deltaZ = e.deltaZ || 0;
}
createPool(WheelEvent);
WheelEventPrototype = WheelEvent.prototype;

WheelEvent.create = function(e) {
    return WheelEvent.getPooled(e);
};

WheelEventPrototype.destroy = function() {
    WheelEvent.release(this);
};

WheelEventPrototype.destructor = function() {
    this.type = null;
    this.deltaX = null;
    this.deltaY = null;
    this.deltaZ = null;
};

function getDeltaX(e) {
    return e.deltaX != null ? e.deltaX : (
        e.wheelDeltaX != null ? -e.wheelDeltaX : 0
    );
}

function getDeltaY(e) {
    return e.deltaY != null ? e.deltaY : (
        e.wheelDeltaY != null ? -e.wheelDeltaY : (
            e.wheelDelta != null ? -e.wheelDelta : 0
        )
    );
}


},
function(require, exports, module, global) {

var createPool = require(102),
    keyCodes = require(105);


var KeyEventPrototype;


module.exports = KeyEvent;


function KeyEvent(e) {
    var keyCode = e.keyCode;

    this.type = e.type;
    this.key = keyCodes[keyCode];
    this.keyCode = keyCode;
}
createPool(KeyEvent);
KeyEventPrototype = KeyEvent.prototype;

KeyEvent.create = function(e) {
    return KeyEvent.getPooled(e);
};

KeyEventPrototype.destroy = function() {
    KeyEvent.release(this);
};

KeyEventPrototype.destructor = function() {
    this.type = null;
    this.key = null;
    this.keyCode = null;
};


},
function(require, exports, module, global) {

module.exports = {
    0: "\\",
    8: "backspace",
    9: "tab",
    12: "num",
    13: "enter",
    16: "shift",
    17: "ctrl",
    18: "alt",
    19: "pause",
    20: "caps",
    27: "esc",
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    44: "print",
    45: "insert",
    46: "delete",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    91: "cmd",
    92: "cmd",
    93: "cmd",
    96: "num_0",
    97: "num_1",
    98: "num_2",
    99: "num_3",
    100: "num_4",
    101: "num_5",
    102: "num_6",
    103: "num_7",
    104: "num_8",
    105: "num_9",
    106: "num_multiply",
    107: "num_add",
    108: "num_enter",
    109: "num_subtract",
    110: "num_decimal",
    111: "num_divide",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",
    124: "print",
    144: "num",
    145: "scroll",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "\'",
    223: "`",
    224: "cmd",
    225: "alt",
    57392: "ctrl",
    63289: "num",
    59: ";",
    61: "-",
    173: "="
};


},
function(require, exports, module, global) {

var createPool = require(102);


var TouchEventPrototype,
    TouchPrototype;


module.exports = TouchEvent;


function TouchEvent(e) {
    var target = e.target;

    this.type = e.type;
    this.touches = getTouches(this.touches, e.touches, target);
    this.targetTouches = getTouches(this.targetTouches, e.targetTouches, target);
    this.changedTouches = getTouches(this.changedTouches, e.changedTouches, target);
}
createPool(TouchEvent);
TouchEventPrototype = TouchEvent.prototype;

TouchEvent.create = function(e) {
    return TouchEvent.getPooled(e);
};

TouchEventPrototype.destroy = function() {
    TouchEvent.release(this);
};

TouchEventPrototype.destructor = function() {
    this.type = null;
    destroyTouches(this.touches);
    destroyTouches(this.targetTouches);
    destroyTouches(this.changedTouches);
};

function getTouches(touches, nativeTouches, target) {
    var length = nativeTouches.length,
        i = -1,
        il = length - 1,
        touch, nativeTouch;

    touches = touches || [];

    while (i++ < il) {
        nativeTouch = nativeTouches[i];
        touch = Touch.create(nativeTouch, target);
        touches[i] = touch;
    }

    return touches;
}

function destroyTouches(touches) {
    var i = -1,
        il = touches.length - 1;

    while (i++ < il) {
        touches[i].destroy();
    }

    touches.length = 0;
}

function Touch(nativeTouch, target) {
    this.identifier = nativeTouch.identifier;
    this.x = getTouchX(nativeTouch, target);
    this.y = getTouchY(nativeTouch, target);
    this.radiusX = getRadiusX(nativeTouch);
    this.radiusY = getRadiusY(nativeTouch);
    this.rotationAngle = getRotationAngle(nativeTouch);
    this.force = getForce(nativeTouch);
}
createPool(Touch);
TouchPrototype = Touch.prototype;

Touch.create = function(nativeTouch, target) {
    return Touch.getPooled(nativeTouch, target);
};

TouchPrototype.destroy = function() {
    Touch.release(this);
};

TouchPrototype.destructor = function() {
    this.identifier = null;
    this.x = null;
    this.y = null;
    this.radiusX = null;
    this.radiusY = null;
    this.rotationAngle = null;
    this.force = null;
};

function getTouchX(touch, target) {
    return touch.clientX - ((target.offsetLeft || 0) - (window.pageXOffset || 0));
}

function getTouchY(touch, target) {
    return touch.clientY - ((target.offsetTop || 0) - (window.pageYOffset || 0));
}

function getRadiusX(nativeTouch) {
    return (
        nativeTouch.radiusX != null ? nativeTouch.radiusX :
        nativeTouch.webkitRadiusX != null ? nativeTouch.webkitRadiusX :
        nativeTouch.mozRadiusX != null ? nativeTouch.mozRadiusX :
        nativeTouch.msRadiusX != null ? nativeTouch.msRadiusX :
        nativeTouch.oRadiusX != null ? nativeTouch.oRadiusX :
        0
    );
}

function getRadiusY(nativeTouch) {
    return (
        nativeTouch.radiusY != null ? nativeTouch.radiusY :
        nativeTouch.webkitRadiusY != null ? nativeTouch.webkitRadiusY :
        nativeTouch.mozRadiusY != null ? nativeTouch.mozRadiusY :
        nativeTouch.msRadiusY != null ? nativeTouch.msRadiusY :
        nativeTouch.oRadiusY != null ? nativeTouch.oRadiusY :
        0
    );
}

function getRotationAngle(nativeTouch) {
    return (
        nativeTouch.rotationAngle != null ? nativeTouch.rotationAngle :
        nativeTouch.webkitRotationAngle != null ? nativeTouch.webkitRotationAngle :
        nativeTouch.mozRotationAngle != null ? nativeTouch.mozRotationAngle :
        nativeTouch.msRotationAngle != null ? nativeTouch.msRotationAngle :
        nativeTouch.oRotationAngle != null ? nativeTouch.oRotationAngle :
        0
    );
}

function getForce(nativeTouch) {
    return (
        nativeTouch.force != null ? nativeTouch.force :
        nativeTouch.webkitForce != null ? nativeTouch.webkitForce :
        nativeTouch.mozForce != null ? nativeTouch.mozForce :
        nativeTouch.msForce != null ? nativeTouch.msForce :
        nativeTouch.oForce != null ? nativeTouch.oForce :
        1
    );
}


},
function(require, exports, module, global) {

var createPool = require(102);


var DeviceMotionEventPrototype;


module.exports = DeviceMotionEvent;


function DeviceMotionEvent(e) {
    this.type = e.type;
    this.accelerationIncludingGravity = e.accelerationIncludingGravity;
}
createPool(DeviceMotionEvent);
DeviceMotionEventPrototype = DeviceMotionEvent.prototype;

DeviceMotionEvent.create = function(e) {
    return DeviceMotionEvent.getPooled(e);
};

DeviceMotionEventPrototype.destroy = function() {
    DeviceMotionEvent.release(this);
};

DeviceMotionEventPrototype.destructor = function() {
    this.type = null;
    this.accelerationIncludingGravity = null;
};


},
function(require, exports, module, global) {

var vec2 = require(64);


var MousePrototype;


module.exports = Mouse;


function Mouse() {
    this.position = vec2.create();
    this.delta = vec2.create();
    this.wheel = null;
    this.__first = null;
}
MousePrototype = Mouse.prototype;

Mouse.create = function() {
    return (new Mouse()).construct();
};

MousePrototype.construct = function() {

    this.wheel = 0;
    this.__first = false;

    return this;
};

MousePrototype.destructor = function() {

    vec2.set(this.position, 0, 0);
    vec2.set(this.delta, 0, 0);
    this.wheel = null;
    this.__first = null;

    return this;
};

MousePrototype.update = function(x, y) {
    var first = this.__first,
        position = this.position,
        delta = this.delta,

        lastX = first ? position[0] : x,
        lastY = first ? position[1] : y;

    position[0] = x;
    position[1] = y;

    delta[0] = x - lastX;
    delta[1] = y - lastY;

    this.__first = true;
};

MousePrototype.toJSON = function(json) {

    json = json || {};

    json.position = vec2.copy(json.position || [], this.position);
    json.delta = vec2.copy(json.delta || [], this.delta);
    json.wheel = this.wheel;

    return json;
};

MousePrototype.fromJSON = function(json) {

    vec2.copy(this.position, json.position);
    vec2.copy(this.delta, json.delta);
    this.wheel = json.wheel;

    return this;
};


},
function(require, exports, module, global) {

var Button = require(110);


var ButtonsPrototype;


module.exports = Buttons;


function Buttons() {
    this.__array = [];
    this.__hash = {};
}
ButtonsPrototype = Buttons.prototype;

Buttons.create = function() {
    return (new Buttons()).construct();
};

ButtonsPrototype.construct = function() {

    Buttons_add(this, "mouse0");
    Buttons_add(this, "mouse1");
    Buttons_add(this, "mouse2");

    return this;
};

ButtonsPrototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = -1,
        il = array.length - 1,
        button;

    while (i++ < il) {
        button = array[i];
        button.destructor();
        array.splice(i, 1);
        delete hash[button.name];
    }

    return this;
};

ButtonsPrototype.on = function(name, time, frame) {
    return (this.__hash[name] || Buttons_add(this, name)).on(time, frame);
};

ButtonsPrototype.off = function(name, time, frame) {
    return (this.__hash[name] || Buttons_add(this, name)).off(time, frame);
};

ButtonsPrototype.allOff = function(time, frame) {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].off(time, frame);
    }

    return this;
};

function Buttons_add(_this, name) {
    var button = Button.create(name),
        array = _this.__array;

    array[array.length] = button;
    _this.__hash[name] = button;

    return button;
}

ButtonsPrototype.toJSON = function(json) {

    json = json || {};

    json.array = eachToJSON(this.__array, json.array || []);

    return json;
};

function eachToJSON(array, out) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        out[i] = array[i].toJSON(out[i]);
    }

    return out;
}

ButtonsPrototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        button;

    array.length = 0;

    while (i++ < il) {
        button = new Button();
        button.fromJSON(jsonArray[i]);

        array[array.length] = button;
        hash[button.name] = button;
    }

    return this;
};


},
function(require, exports, module, global) {

var ButtonPrototype;


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
ButtonPrototype = Button.prototype;

Button.create = function(name) {
    return (new Button()).construct(name);
};

ButtonPrototype.construct = function(name) {

    this.name = name;

    this.timeDown = -1;
    this.timeUp = -1;

    this.frameDown = -1;
    this.frameUp = -1;

    this.value = false;
    this.__first = true;

    return this;
};

ButtonPrototype.destructor = function() {

    this.name = null;

    this.timeDown = null;
    this.timeUp = null;

    this.frameDown = null;
    this.frameUp = null;

    this.value = null;
    this.__first = null;

    return this;
};

ButtonPrototype.on = function(time, frame) {

    if (this.__first) {
        this.frameDown = frame;
        this.timeDown = time;
        this.__first = false;
    }

    this.value = true;

    return this;
};

ButtonPrototype.off = function(time, frame) {

    this.frameUp = frame;
    this.timeUp = time;
    this.value = false;
    this.__first = true;

    return this;
};

ButtonPrototype.toJSON = function(json) {

    json = json || {};

    json.name = this.name;

    json.timeDown = this.timeDown;
    json.timeUp = this.timeUp;

    json.frameDown = this.frameDown;
    json.frameUp = this.frameUp;

    json.value = this.value;

    return json;
};

ButtonPrototype.fromJSON = function(json) {

    this.name = json.name;

    this.timeDown = json.timeDown;
    this.timeUp = json.timeUp;

    this.frameDown = json.frameDown;
    this.frameUp = json.frameUp;

    this.value = json.value;
    this.__first = true;

    return this;
};


},
function(require, exports, module, global) {

var indexOf = require(57),
    Touch = require(112);


var TouchesPrototype;


module.exports = Touches;


function Touches() {
    this.__array = [];
}
TouchesPrototype = Touches.prototype;

Touches.create = function() {
    return (new Touches()).construct();
};

TouchesPrototype.construct = function() {
    return this;
};

TouchesPrototype.destructor = function() {
    this.__array.length = 0;
    return this;
};

function findTouch(array, id) {
    var i = -1,
        il = array.length - 1,
        touch;

    while (i++ < il) {
        touch = array[i];

        if (touch.id === id) {
            return touch;
        }
    }

    return null;
}

TouchesPrototype.__start = function(targetTouch) {
    var array = this.__array,
        oldTouch = findTouch(array, targetTouch.identifier),
        touch;

    if (oldTouch === null) {
        touch = Touch.create(targetTouch);
        array[array.length] = touch;
        return touch;
    } else {
        return oldTouch;
    }
};

TouchesPrototype.__end = function(changedTouch) {
    var array = this.__array,
        touch = findTouch(array, changedTouch.identifier);

    if (touch !== null) {
        array.splice(indexOf(array, touch), 1);
    }

    return touch;
};

TouchesPrototype.__move = function(changedTouch) {
    var touch = findTouch(this.__array, changedTouch.identifier);

    if (touch !== null) {
        touch.update(changedTouch);
    }

    return touch;
};

TouchesPrototype.get = function(index) {
    return this.__array[index];
};

TouchesPrototype.allOff = function() {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].destroy();
    }
    array.length = 0;
};

TouchesPrototype.toJSON = function(json) {

    json = json || {};

    json.array = eachToJSON(this.__array, json.array || []);

    return json;
};

function eachToJSON(array, out) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        out[i] = array[i].toJSON(out[i]);
    }

    return out;
}

TouchesPrototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        button;

    array.length = 0;

    while (i++ < il) {
        button = Touch.create();
        button.fromJSON(jsonArray[i]);

        array[array.length] = button;
        hash[button.name] = button;
    }

    return this;
};


},
function(require, exports, module, global) {

var vec2 = require(64),
    createPool = require(102);


var TouchPrototype;


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
}
createPool(Touch);
TouchPrototype = Touch.prototype;

Touch.create = function(e) {
    return (Touch.getPooled()).construct(e);
};

TouchPrototype.destroy = function() {
    return Touch.release(this);
};

TouchPrototype.construct = function(e) {

    this.id = e.identifier;

    vec2.set(this.delta, 0, 0);
    vec2.set(this.position, e.x, e.y);

    this.radiusX = e.radiusX;
    this.radiusY = e.radiusY;
    this.rotationAngle = e.rotationAngle;
    this.force = e.force;

    return this;
};

TouchPrototype.destructor = function() {

    this.id = null;

    this.radiusX = null;
    this.radiusY = null;
    this.rotationAngle = null;
    this.force = null;

    vec2.set(this.delta, 0, 0);
    vec2.set(this.position, 0, 0);

    return this;
};

TouchPrototype.update = function(e) {
    var position = this.position,
        delta = this.delta,

        x = e.x,
        y = e.y,

        lastX = position[0],
        lastY = position[1];

    position[0] = x;
    position[1] = y;

    delta[0] = x - lastX;
    delta[1] = y - lastY;

    this.radiusX = e.radiusX;
    this.radiusY = e.radiusY;
    this.rotationAngle = e.rotationAngle;
    this.force = e.force;

    return this;
};

TouchPrototype.toJSON = function(json) {
    json = json || {};

    json.id = this.id;

    json.radiusX = this.radiusX;
    json.radiusY = this.radiusY;
    json.rotationAngle = this.rotationAngle;
    json.force = this.force;

    json.delta = vec2.copy(json.delta || [], this.delta);
    json.position = vec2.copy(json.position || [], this.position);

    return json;
};

TouchPrototype.fromJSON = function(json) {

    this.id = json.id;

    this.radiusX = json.radiusX;
    this.radiusY = json.radiusY;
    this.rotationAngle = json.rotationAngle;
    this.force = json.force;

    vec2.copy(this.delta, json.delta);
    vec2.copy(this.position, json.position);

    return this;
};


},
function(require, exports, module, global) {

var Axis = require(114);


var AxesPrototype;


module.exports = Axes;


function Axes() {
    this.__array = [];
    this.__hash = {};
}
AxesPrototype = Axes.prototype;

Axes.create = function() {
    return (new Axes()).construct();
};

AxesPrototype.construct = function() {

    this.add({
        name: "horizontal",
        posButton: "right",
        negButton: "left",
        altPosButton: "d",
        altNegButton: "a",
        type: Axis.ButtonType
    });

    this.add({
        name: "vertical",
        posButton: "up",
        negButton: "down",
        altPosButton: "w",
        altNegButton: "s",
        type: Axis.ButtonType
    });

    this.add({
        name: "fire",
        posButton: "ctrl",
        negButton: "",
        altPosButton: "mouse0",
        altNegButton: "",
        type: Axis.ButtonType
    });

    this.add({
        name: "jump",
        posButton: "space",
        negButton: "",
        altPosButton: "mouse2",
        altNegButton: "",
        type: Axis.ButtonType
    });

    this.add({
        name: "mouseX",
        type: Axis.MouseType,
        axis: 0
    });

    this.add({
        name: "mouseY",
        type: Axis.MouseType,
        axis: 1
    });

    this.add({
        name: "touchX",
        type: Axis.TouchType,
        axis: 0
    });

    this.add({
        name: "touchY",
        type: Axis.TouchType,
        axis: 1
    });

    this.add({
        name: "mouseWheel",
        type: Axis.WheelType
    });

    return this;
};

AxesPrototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = -1,
        il = array.length - 1,
        axis;

    while (i++ < il) {
        axis = array[i];
        axis.destructor();
        array.splice(i, 1);
        delete hash[axis.name];
    }

    return this;
};

AxesPrototype.add = function(options) {
    var hash = this.__hash,
        array = this.__array,
        instance;

    options = options || {};

    if (hash[name]) {
        throw new Error(
            'Axes add(): Axes already have Axis named ' + name + ' use Axes.get("' + name + '") and edit it instead'
        );
    }

    instance = Axis.create(
        options.name,
        options.negButton, options.posButton,
        options.altNegButton, options.altPosButton,
        options.gravity, options.sensitivity, options.dead, options.type, options.axis, options.index, options.joyNum
    );

    array[array.length] = instance;
    hash[instance.name] = instance;

    return instance;
};

AxesPrototype.get = function(name) {
    return this.__hash[name];
};

AxesPrototype.update = function(input, dt) {
    var array = this.__array,
        i = -1,
        il = array.length - 1;

    while (i++ < il) {
        array[i].update(input, dt);
    }

    return this;
};

AxesPrototype.toJSON = function(json) {

    json = json || {};

    json.array = eachToJSON(this.__array, json.array || []);

    return json;
};

function eachToJSON(array, out) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        out[i] = array[i].toJSON(out[i]);
    }

    return out;
}

AxesPrototype.fromJSON = function(json) {
    var jsonArray = json.array,
        i = -1,
        il = jsonArray.length - 1,
        array = this.__array,
        hash = this.__hash = {},
        axis;

    array.length = 0;

    while (i++ < il) {
        axis = new Axis();
        axis.fromJSON(jsonArray[i]);

        array[array.length] = axis;
        hash[axis.name] = axis;
    }

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var AxisPrototype;


module.exports = Axis;


function Axis() {
    this.name = null;

    this.negButton = null;
    this.posButton = null;

    this.altNegButton = null;
    this.altPosButton = null;

    this.gravity = null;
    this.sensitivity = null;

    this.dead = null;

    this.type = null;
    this.axis = null;
    this.index = null;

    this.joyNum = null;

    this.value = null;
}
AxisPrototype = Axis.prototype;

Axis.ButtonType = 1;
Axis.MouseType = 2;
Axis.TouchType = 3;
Axis.WheelType = 4;
Axis.JoystickType = 5;

Axis.create = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, joyNum
) {
    return (new Axis()).construct(
        name,
        negButton, posButton,
        altNegButton, altPosButton,
        gravity, sensitivity, dead, type, axis, index, joyNum
    );
};

AxisPrototype.construct = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, joyNum
) {

    this.name = name != null ? name : "unknown";

    this.negButton = negButton != null ? negButton : "";
    this.posButton = posButton != null ? posButton : "";

    this.altNegButton = altNegButton != null ? altNegButton : "";
    this.altPosButton = altPosButton != null ? altPosButton : "";

    this.gravity = gravity != null ? gravity : 3;
    this.sensitivity = sensitivity != null ? sensitivity : 3;

    this.dead = dead != null ? dead : 0.001;

    this.type = type != null ? type : Axis.ButtonType;
    this.axis = axis != null ? axis : "x";
    this.index = index != null ? index : 0;

    this.joyNum = joyNum != null ? joyNum : 0;

    this.value = 0;

    return this;
};

AxisPrototype.destructor = function() {

    this.name = null;

    this.negButton = null;
    this.posButton = null;

    this.altNegButton = null;
    this.altPosButton = null;

    this.gravity = null;
    this.sensitivity = null;

    this.dead = null;

    this.type = null;
    this.axis = null;
    this.index = null;

    this.joyNum = null;

    this.value = null;

    return this;
};

AxisPrototype.update = function(input, dt) {
    var value = this.value,
        type = this.type,
        sensitivity = this.sensitivity,
        buttons, button, altButton, neg, pos, touch, tmp;

    if (type === Axis.ButtonType) {
        buttons = input.buttons.__hash;

        button = buttons[this.negButton];
        altButton = buttons[this.altNegButton];
        neg = button && button.value || altButton && altButton.value;

        button = buttons[this.posButton];
        altButton = buttons[this.altPosButton];
        pos = button && button.value || altButton && altButton.value;

    } else if (type === Axis.MouseType) {
        this.value = input.mouse.delta[this.axis];
        return this;
    } else if (type === Axis.TouchType) {
        touch = input.touches.__array[this.index];

        if (touch) {
            this.value = touch.delta[this.axis];
        } else {
            return this;
        }
    } else if (type === Axis.WheelType) {
        value += input.mouse.wheel;
    } else if (type === Axis.JoystickType) {
        return this;
    }

    if (neg) {
        value -= sensitivity * dt;
    }
    if (pos) {
        value += sensitivity * dt;
    }

    if (!pos && !neg && value !== 0) {
        tmp = mathf.abs(value);
        value -= mathf.clamp(mathf.sign(value) * this.gravity * dt, -tmp, tmp);
    }

    value = mathf.clamp(value, -1, 1);
    if (mathf.abs(value) <= this.dead) {
        value = 0;
    }

    this.value = value;

    return this;
};

AxisPrototype.fromJSON = function(json) {
    this.name = json.name;

    this.negButton = json.negButton;
    this.posButton = json.posButton;

    this.altNegButton = json.altNegButton;
    this.altPosButton = json.altPosButton;

    this.gravity = json.gravity;
    this.sensitivity = json.sensitivity;

    this.dead = json.dead;

    this.type = json.type;
    this.axis = json.axis;
    this.index = json.index;

    this.joyNum = json.joyNum;

    this.value = json.value;

    return this;
};

AxisPrototype.toJSON = function(json) {

    json = json || {};

    json.name = this.name;

    json.negButton = this.negButton;
    json.posButton = this.posButton;

    json.altNegButton = this.altNegButton;
    json.altPosButton = this.altPosButton;

    json.gravity = this.gravity;
    json.sensitivity = this.sensitivity;

    json.dead = this.dead;

    json.type = this.type;
    json.axis = this.axis;
    json.index = this.index;

    json.joyNum = this.joyNum;

    json.value = this.value;

    return json;
};


},
function(require, exports, module, global) {

var mathf = require(32);


var eventHandlers = exports,
    mouseButtons = [
        "mouse0",
        "mouse1",
        "mouse2"
    ];


eventHandlers.keyup = function(input, e, time, frame) {
    var key = e.key,
        button = input.buttons.off(key, time, frame);

    input.emit("keyup", e, button);
};

eventHandlers.keydown = function(input, e, time, frame) {
    var key = e.key,
        button = input.buttons.on(key, time, frame);

    input.emit("keydown", e, button);
};


eventHandlers.mousemove = function(input, e) {
    input.mouse.update(e.x, e.y);
    input.emit("mousemove", e, input.mouse);
};

eventHandlers.mousedown = function(input, e, time, frame) {
    var button = input.buttons.on(mouseButtons[e.button], time, frame);

    input.emit("mousedown", e, button, input.mouse);
};

eventHandlers.mouseup = function(input, e, time, frame) {
    var button = input.buttons.off(mouseButtons[e.button], time, frame);

    input.emit("mouseup", e, button, input.mouse);
};

eventHandlers.mouseout = function(input, e, time, frame) {

    input.mouse.update(e.x, e.y);
    input.buttons.allOff(time, frame);

    input.emit("mouseout", e, input.mouse);
};

eventHandlers.wheel = function(input, e) {
    var value = mathf.sign(e.deltaY);

    input.mouse.wheel = value;
    input.emit("wheel", e, value, input.mouse);
};


eventHandlers.touchstart = function(input, e) {
    var touches = input.touches,
        targetTouches = e.targetTouches,
        i = -1,
        il = targetTouches.length - 1,
        touch;

    while (i++ < il) {
        touch = touches.__start(targetTouches[i]);

        if (touch) {
            input.emit("touchstart", e, touch, touches);
        }
    }
};

eventHandlers.touchend = function(input, e) {
    var touches = input.touches,
        changedTouches = e.changedTouches,
        i = -1,
        il = changedTouches.length - 1,
        touch;

    while (i++ < il) {
        touch = touches.__end(changedTouches[i]);

        if (touch) {
            input.emit("touchend", e, touch, touches);
            touch.destroy();
        }
    }
};

eventHandlers.touchmove = function(input, e) {
    var touches = input.touches,
        changedTouches = e.changedTouches,
        i = -1,
        il = changedTouches.length - 1,
        touch;

    while (i++ < il) {
        touch = touches.__move(changedTouches[i]);

        if (touch) {
            input.emit("touchmove", e, touch, touches);
        }
    }
};

eventHandlers.touchcancel = function(input, e) {
    input.emit("touchcancel", e);
    input.touches.allOff();
};

eventHandlers.devicemotion = function(input, e) {
    var acc = e.accelerationIncludingGravity,
        acceleration;

    if (acc && (acc.x || acc.y || acc.z)) {
        acceleration = input.acceleration;

        acceleration.x = acc.x;
        acceleration.y = acc.y;
        acceleration.z = acc.z;

        input.emit("acceleration", e, acceleration);
    }
};


},
function(require, exports, module, global) {

var time = require(29);


var TimePrototype;


module.exports = Time;


function Time() {
    var _this = this,
        START = time.now() * 0.001,
        scale = 1,

        globalFixed = 1 / 60,
        fixedDelta = 1 / 60,

        frameCount = 0,
        last = -1 / 60,
        current = 0,
        delta = 1 / 60,
        fpsFrame = 0,
        fpsLast = 0,

        MIN_DELTA = 0.000001,
        MAX_DELTA = 1;

    this.time = 0;
    this.fps = 60;
    this.delta = 1 / 60;
    this.frameCount = 0;

    this.start = function() {
        return START;
    };

    this.update = function() {
        _this.frameCount = frameCount++;

        last = _this.time;
        current = _this.now() - START;

        fpsFrame++;
        if (fpsLast + 1 < current) {
            _this.fps = fpsFrame / (current - fpsLast);

            fpsLast = current;
            fpsFrame = 0;
        }

        delta = (current - last) * _this.scale;
        _this.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

        _this.time = current;
    };

    this.setStartTime = function(value) {
        START = value;
    };

    this.setFrame = function(value) {
        frameCount = value;
    };

    this.scale = scale;
    this.setScale = function(value) {
        _this.scale = value;
        _this.fixedDelta = globalFixed * value;
    };

    this.fixedDelta = fixedDelta;
    this.setFixedDelta = function(value) {
        globalFixed = value;
        _this.fixedDelta = globalFixed * scale;
    };

    this.construct = function() {
        START = time.now() * 0.001;
        frameCount = 0;

        _this.time = 0;
        _this.fps = 60;
        _this.delta = 1 / 60;
        _this.frameCount = frameCount;

        _this.setScale(1);
        _this.setFixedDelta(1 / 60);
    };

    this.toJSON = function(json) {

        json = json || {};

        json.start = _this.start();
        json.frameCount = _this.frameCount;
        json.scale = _this.scale;
        json.fixedDelta = _this.fixedDelta;

        return json;
    };

    this.fromJSON = function(json) {

        json = json || {};

        _this.setStartTime(json.start);
        _this.setFrame(json.frameCount);
        _this.setScale(json.scale);
        _this.setFixedDelta(json.fixedDelta);

        return _this;
    };
}
TimePrototype = Time.prototype;

Time.create = function() {
    return new Time();
};

TimePrototype.now = function() {
    return time.now() * 0.001;
};

TimePrototype.stamp = function() {
    return time.stamp() * 0.001;
};

TimePrototype.stampMS = function() {
    return time.stamp();
};


},
function(require, exports, module, global) {

var indexOf = require(57),
    Class = require(9);


var ClassPrototype = Class.prototype,
    EntityPrototype;


module.exports = Entity;


function Entity() {

    Class.call(this);

    this.name = null;

    this.__componentArray = [];
    this.components = {};

    this.depth = null;
    this.scene = null;
    this.root = null;
    this.parent = null;
    this.children = [];
}
Class.extend(Entity, "odin.Entity");
EntityPrototype = Entity.prototype;

EntityPrototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name || this.__id;

    this.depth = 0;
    this.root = this;

    return this;
};

EntityPrototype.destructor = function() {
    var components = this.__componentArray,
        i = -1,
        il = components.length - 1;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        components[i].destroy(false).destructor();
    }

    this.name = null;

    this.depth = null;
    this.scene = null;
    this.root = null;
    this.parent = null;
    this.children.length = 0;

    return this;
};

EntityPrototype.destroy = function(emitEvent) {
    var scene = this.scene;

    if (scene) {
        if (emitEvent !== false) {
            this.emit("destroy");
        }
        scene.remove(this);
    }

    return this;
};

EntityPrototype.hasComponent = function(name) {
    return !!this.components[name];
};

EntityPrototype.getComponent = function(name) {
    return this.components[name];
};

EntityPrototype.addComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_addComponent(this, arguments[i]);
    }

    return this;
};

function Entity_addComponent(_this, component) {
    var className = component.className,
        componentHash = _this.components,
        components = _this.__componentArray,
        scene = _this.scene;

    if (!componentHash[className]) {
        component.entity = _this;

        components[components.length] = component;
        componentHash[className] = component;

        if (scene) {
            scene.__addComponent(component);
        }

        component.init();
    } else {
        throw new Error(
            "Entity addComponent(...components) trying to add " +
            "components that is already a member of Entity"
        );
    }
}

EntityPrototype.removeComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_removeComponent(this, arguments[i]);
    }
    return this;
};

function Entity_removeComponent(_this, component) {
    var className = component.className,
        componentHash = _this.components,
        components = _this.__componentArray,
        index = components.indexOf(components, component),
        scene = _this.scene;

    if (index === -1) {
        if (scene) {
            scene.__removeComponent(component);
        }

        component.entity = null;

        components.splice(index, 1);
        delete componentHash[className];
    } else {
        throw new Error(
            "Entity removeComponent(...components) trying to remove " +
            "component that is already not a member of Entity"
        );
    }
}

EntityPrototype.addChild = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_addChild(this, arguments[i]);
    }
    return this;
};

function Entity_addChild(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        root = _this,
        depth = 0,
        scene = _this.scene;

    if (index === -1) {
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }

        children[children.length] = entity;

        entity.parent = _this;

        while (root.parent) {
            root = root.parent;
            depth++;
        }
        _this.root = root;
        entity.root = root;

        updateDepth(_this, depth);

        _this.emit("addChild", entity);

        if (scene && entity.scene !== scene) {
            scene.addEntity(entity);
        }
    } else {
        throw new Error(
            "Entity add(...entities) trying to add object " +
            "that is already a member of Entity"
        );
    }
}

EntityPrototype.removeChild = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_removeChild(this, arguments[i]);
    }
    return this;
};

function Entity_removeChild(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        scene = _this.scene;

    if (index !== -1) {
        _this.emit("removeChild", entity);

        children.splice(index, 1);

        entity.parent = null;
        entity.root = entity;

        updateDepth(entity, 0);

        if (scene && entity.scene === scene) {
            scene.remove(entity);
        }
    } else {
        throw new Error(
            "Entity removeChild(...entities) trying to remove " +
            "object that is not a member of Entity"
        );
    }
}

function updateDepth(child, depth) {
    var children = child.children,
        i = -1,
        il = children.length - 1;

    child.depth = depth;

    while (i++ < il) {
        updateDepth(children[i], depth + 1);
    }
}

EntityPrototype.toJSON = function(json) {
    var components = this.__componentArray,
        children = this.children,
        i = -1,
        il = components.length - 1,
        jsonComponents, jsonChildren;

    json = ClassPrototype.toJSON.call(this, json);

    jsonComponents = json.components || (json.components = []);

    while (i++ < il) {
        jsonComponents[i] = components[i].toJSON(jsonComponents[i]);
    }

    i = -1;
    il = children.length - 1;

    jsonChildren = json.children || (json.children = []);

    while (i++ < il) {
        jsonChildren[i] = children[i].toJSON(jsonChildren[i]);
    }

    json.name = this.name;

    return json;
};

EntityPrototype.fromJSON = function(json) {
    var scene = this.scene,
        jsonComponents = json.components,
        jsonChildren = json.children,
        i = -1,
        il = jsonComponents.length - 1,
        component, entity;

    ClassPrototype.fromJSON.call(this, json);

    this.name = json.name;

    while (i++ < il) {
        json = jsonComponents[i];
        component = Class.getClass(json.className).create();
        component.entity = this;
        component.fromJSON(json);
        this.addComponent(component);
    }

    i = -1;
    il = jsonChildren.length - 1;

    while (i++ < il) {
        entity = Entity.create();
        entity.scene = scene;
        entity.fromJSON(jsonChildren[i]);
        this.add(entity);
    }

    return this;
};


},
function(require, exports, module, global) {

var isString = require(18),
    isNumber = require(34),
    Class = require(9),
    BaseApplication = require(91);


var BaseApplicationPrototype = BaseApplication.prototype,
    ApplicationPrototype;


module.exports = Application;


function Application() {
    BaseApplication.call(this);
}
BaseApplication.extend(Application, "odin.Application");
ApplicationPrototype = Application.prototype;

ApplicationPrototype.construct = function() {

    BaseApplicationPrototype.construct.call(this);

    return this;
};

ApplicationPrototype.destructor = function() {

    BaseApplicationPrototype.destructor.call(this);

    return this;
};

ApplicationPrototype.setElement = function(element) {

    this.__loop.setElement(element);

    return this;
};

ApplicationPrototype.createScene = function(scene) {
    var scenes = this.__scenes,
        sceneHash = this.__sceneHash,
        newScene;

    if (isString(scene)) {
        scene = sceneHash[scene];
    } else if (isNumber(scene)) {
        scene = scenes[scene];
    }

    if (sceneHash[scene.name]) {
        newScene = Class.createFromJSON(scene);

        newScene.application = this;
        newScene.init();

        this.emit("createScene", newScene);

        newScene.awake();

        return newScene;
    } else {
        throw new Error("Application.createScene(scene) Scene could not be found in Application");
    }

    return null;
};

ApplicationPrototype.init = function() {

    BaseApplicationPrototype.init.call(this);

    return this;
};

ApplicationPrototype.loop = function() {

    BaseApplicationPrototype.loop.call(this);

    return this;
};


},
function(require, exports, module, global) {

var Class = require(9);


var ClassPrototype = Class.prototype,
    AssetPrototype;


module.exports = Asset;


function Asset() {

    Class.call(this);

    this.name = null;
    this.src = null;
    this.data = null;
}
Class.extend(Asset, "odin.Asset");
AssetPrototype = Asset.prototype;

AssetPrototype.construct = function(name, src) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.src = src;

    return this;
};

AssetPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.name = null;
    this.src = null;
    this.data = null;

    return this;
};

AssetPrototype.setSrc = function(src) {
    this.src = src;
    return this;
};

AssetPrototype.parse = function() {
    this.emit("parse");
    return this;
};

AssetPrototype.load = function(callback) {
    this.emit("load");
    callback();
    return this;
};


},
function(require, exports, module, global) {

var environment = require(1),
    eventListener = require(2),
    HttpError = require(121),
    Asset = require(119);


var AssetPrototype = Asset.prototype,
    ImageAssetPrototype;


module.exports = ImageAsset;


function ImageAsset() {

    Asset.call(this);

    this.__listenedTo = null;
}
Asset.extend(ImageAsset, "odin.ImageAsset");
ImageAssetPrototype = ImageAsset.prototype;

ImageAssetPrototype.construct = function(name, src) {

    AssetPrototype.construct.call(this, name, src);

    this.data = environment.browser ? new Image() : null;
    this.__listenedTo = false;

    return this;
};

ImageAssetPrototype.destructor = function() {

    AssetPrototype.destructor.call(this);

    this.__listenedTo = null;

    return this;
};

ImageAssetPrototype.setSrc = function(src) {

    AssetPrototype.setSrc.call(this, src);

    if (this.__listenedTo) {
        this.image.src = src;
    }

    return this;
};

ImageAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src,
        image = this.data;

    eventListener.on(image, "load", function() {
        _this.parse();
        _this.emit("load");
        callback();
    });

    eventListener.on(image, "error", function(e) {
        var err = new HttpError(e.status, src);

        _this.emit("error", err);
        callback(err);
    });

    image.src = src;
    this.__listenedTo = true;

    return this;
};


},
function(require, exports, module, global) {

var forEach = require(43),
    create = require(12),
    STATUS_CODES = require(122);


var STATUS_NAMES = {},
    STATUS_STRINGS = {};


forEach(STATUS_CODES, function(status, code) {
    var name;

    if (code < 400) {
        return;
    }

    name = status.replace(/\s+/g, "");

    if (!(/\w+Error$/.test(name))) {
        name += "Error";
    }

    STATUS_NAMES[code] = name;
    STATUS_STRINGS[code] = status;
});


function HttpError(code, message) {
    if (message instanceof Error) {
        message = message.message;
    }

    if (code instanceof Error) {
        message = code.message;
        code = 500;
    } else if (typeof(code) === "string") {
        message = code;
        code = 500;
    } else {
        code = code || 500;
    }

    Error.call(this);

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

    this.name = STATUS_NAMES[code] || "UnknownHttpError";
    this.code = code;
    this.message = this.name + ": " + code + " " + (message || STATUS_STRINGS[code]);
}
HttpError.prototype = create(Error.prototype);
HttpError.prototype.constructor = HttpError;

HttpError.prototype.toString = function() {

    return this.message;
};

HttpError.prototype.toJSON = function(json) {
    json = json || {};

    json.name = this.name;
    json.code = this.code;
    json.message = this.message;

    return json;
};

HttpError.prototype.fromJSON = function(json) {

    this.name = json.name;
    this.code = json.code;
    this.message = json.message;

    return this;
};


module.exports = HttpError;


},
function(require, exports, module, global) {

module.exports = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Moved Temporarily",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Time-out",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Large",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Unordered Collection",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Time-out",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    509: "Bandwidth Limit Exceeded",
    510: "Not Extended",
    511: "Network Authentication Required"
};


},
function(require, exports, module, global) {

var request = require(124),
    HttpError = require(121),
    Asset = require(119);


var JSONAssetPrototype;


module.exports = JSONAsset;


function JSONAsset() {
    Asset.call(this);
}
Asset.extend(JSONAsset, "odin.JSONAsset");
JSONAssetPrototype = JSONAsset.prototype;

JSONAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src;

    request.get(src, {
        requestHeaders: {
            "Content-Type": "application/json"
        },
        success: function(response) {
            _this.data = response.data;
            _this.parse();
            _this.emit("load");
            callback();
        },
        error: function(response) {
            var err = new HttpError(response.statusCode, src);

            _this.emit("error", err);
            callback(err);
        }
    });

    return this;
};


},
function(require, exports, module, global) {

module.exports = require(125)(require(128));


},
function(require, exports, module, global) {

module.exports = function createRequest(request) {
    var methods = require(126),
        forEach = require(43),
        EventEmitter = require(23),
        defaults = require(127);


    forEach(methods, function(method) {
        var upper = method.toUpperCase();

        request[method] = function(url, options) {
            options = options || {};

            options.url = url;
            options.method = upper;

            return request(options);
        };
    });
    request.mSearch = request["m-search"];

    forEach(["post", "patch", "put"], function(method) {
        var upper = method.toUpperCase();

        request[method] = function(url, data, options) {
            options = options || {};

            options.url = url;
            options.data = data;
            options.method = upper;

            return request(options);
        };
    });

    request.defaults = defaults.values;
    request.plugins = new EventEmitter(-1);

    return request;
};


},
function(require, exports, module, global) {

module.exports = [
    "checkout",
    "connect",
    "copy",
    "delete",
    "get",
    "head",
    "lock",
    "m-search",
    "merge",
    "mkactivity",
    "mkcol",
    "move",
    "notify",
    "options",
    "patch",
    "post",
    "propfind",
    "proppatch",
    "purge",
    "put",
    "report",
    "search",
    "subscribe",
    "trace",
    "unlock",
    "unsubscribe"
];


},
function(require, exports, module, global) {

var extend = require(13),
    isString = require(18),
    isFunction = require(5);


function defaults(options) {
    options = extend({}, defaults.values, options);

    options.url = isString(options.url || (options.url = options.src)) ? options.url : null;
    options.method = isString(options.method) ? options.method.toUpperCase() : "GET";

    options.data = options.data;

    options.transformRequest = isFunction(options.transformRequest) ? options.transformRequest : null;
    options.transformResponse = isFunction(options.transformResponse) ? options.transformResponse : null;

    options.withCredentials = options.withCredentials != null ? !!options.withCredentials : false;
    options.headers = extend({}, defaults.values.headers, options.headers);
    options.async = options.async != null ? !!options.async : true;

    options.success = isFunction(options.success) ? options.success : null;
    options.error = isFunction(options.error) ? options.error : null;
    options.isPromise = !isFunction(options.success) && !isFunction(options.error);

    options.user = isString(options.user) ? options.user : undefined;
    options.password = isString(options.password) ? options.password : undefined;

    return options;
}

defaults.values = {
    url: "",
    method: "GET",
    headers: {
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest"
    }
};


module.exports = defaults;


},
function(require, exports, module, global) {

var PromisePolyfill = require(129),
    XMLHttpRequestPolyfill = require(132),
    isFunction = require(5),
    isString = require(18),
    forEach = require(43),
    trim = require(133),
    extend = require(13),
    Response = require(134),
    defaults = require(127),
    camelcaseHeader = require(135),
    parseContentType = require(138);


var supportsFormData = typeof(FormData) !== "undefined";


defaults.values.XMLHttpRequest = XMLHttpRequestPolyfill;


function parseResponseHeaders(responseHeaders) {
    var headers = {},
        raw = responseHeaders.split("\n");

    forEach(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

        if (key && value) {
            key = camelcaseHeader(key);
            value = trim(value);

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
}


function addEventListener(xhr, event, listener) {
    if (isFunction(xhr.addEventListener)) {
        xhr.addEventListener(event, listener, false);
    } else if (isFunction(xhr.attachEvent)) {
        xhr.attachEvent("on" + event, listener);
    } else {
        xhr["on" + event] = listener;
    }
}

function request(options) {
    var xhr = new defaults.values.XMLHttpRequest(),
        plugins = request.plugins,
        canSetRequestHeader = isFunction(xhr.setRequestHeader),
        canOverrideMimeType = isFunction(xhr.overrideMimeType),
        isFormData, defer;

    options = defaults(options);

    plugins.emit("before", xhr, options);

    isFormData = (supportsFormData && options.data instanceof FormData);

    if (options.isPromise) {
        defer = PromisePolyfill.defer();
    }

    function onSuccess(response) {
        plugins.emit("response", response, xhr, options);
        plugins.emit("load", response, xhr, options);

        if (options.isPromise) {
            defer.resolve(response);
        } else {
            if (options.success) {
                options.success(response);
            }
        }
    }

    function onError(response) {
        plugins.emit("response", response, xhr, options);
        plugins.emit("error", response, xhr, options);

        if (options.isPromise) {
            defer.reject(response);
        } else {
            if (options.error) {
                options.error(response);
            }
        }
    }

    function onComplete() {
        var statusCode = +xhr.status,
            responseText = xhr.responseText,
            response = new Response();

        response.url = xhr.responseURL || options.url;
        response.method = options.method;

        response.statusCode = statusCode;

        response.responseHeaders = xhr.getAllResponseHeaders ? parseResponseHeaders(xhr.getAllResponseHeaders()) : {};
        response.requestHeaders = options.headers ? extend({}, options.headers) : {};

        response.data = null;

        if (responseText) {
            if (options.transformResponse) {
                response.data = options.transformResponse(responseText);
            } else {
                if (parseContentType(response.responseHeaders["Content-Type"]) === "application/json") {
                    try {
                        response.data = JSON.parse(responseText);
                    } catch (e) {
                        response.data = e;
                        onError(response);
                        return;
                    }
                } else if (responseText) {
                    response.data = responseText;
                }
            }
        }

        if ((statusCode > 199 && statusCode < 301) || statusCode === 304) {
            onSuccess(response);
        } else {
            onError(response);
        }
    }

    function onReadyStateChange() {
        switch (+xhr.readyState) {
            case 1:
                plugins.emit("request", xhr, options);
                break;
            case 4:
                onComplete();
                break;
        }
    }

    addEventListener(xhr, "readystatechange", onReadyStateChange);

    if (options.withCredentials && options.async) {
        xhr.withCredentials = options.withCredentials;
    }

    xhr.open(
        options.method,
        options.url,
        options.async,
        options.username,
        options.password
    );

    if (canSetRequestHeader) {
        forEach(options.headers, function(value, key) {
            if (isString(value)) {
                if (key === "Content-Type" && canOverrideMimeType) {
                    xhr.overrideMimeType(value);
                }
                xhr.setRequestHeader(key, value);
            }
        });
    }

    if (options.transformRequest) {
        options.data = options.transformRequest(options.data);
    } else {
        if (!isString(options.data) && !isFormData) {
            if (options.headers["Content-Type"] === "application/json") {
                options.data = JSON.stringify(options.data);
            } else {
                options.data = options.data + "";
            }
        }
    }

    xhr.send(options.data);

    return defer ? defer.promise : undefined;
}


module.exports = request;


},
function(require, exports, module, global) {

var process = require(3);
var isArray = require(54),
    isObject = require(4),
    isFunction = require(5),
    createStore = require(130),
    fastSlice = require(24);


var PromisePolyfill, PrivatePromise;


if (typeof(Promise) !== "undefined") {
    PromisePolyfill = Promise;
} else {
    PrivatePromise = (function() {

        function PrivatePromise(resolver) {
            var _this = this;

            this.handlers = [];
            this.state = null;
            this.value = null;

            handleResolve(
                resolver,
                function resolve(newValue) {
                    resolveValue(_this, newValue);
                },
                function reject(newValue) {
                    rejectValue(_this, newValue);
                }
            );
        }

        PrivatePromise.store = createStore();

        PrivatePromise.handle = function(_this, onFulfilled, onRejected, resolve, reject) {
            handle(_this, new Handler(onFulfilled, onRejected, resolve, reject));
        };

        function Handler(onFulfilled, onRejected, resolve, reject) {
            this.onFulfilled = isFunction(onFulfilled) ? onFulfilled : null;
            this.onRejected = isFunction(onRejected) ? onRejected : null;
            this.resolve = resolve;
            this.reject = reject;
        }

        function handleResolve(resolver, onFulfilled, onRejected) {
            var done = false;

            try {
                resolver(
                    function(value) {
                        if (done) {
                            return;
                        }
                        done = true;
                        onFulfilled(value);
                    },
                    function(reason) {
                        if (done) {
                            return;
                        }
                        done = true;
                        onRejected(reason);
                    }
                );
            } catch (err) {
                if (done) {
                    return;
                }
                done = true;
                onRejected(err);
            }
        }

        function resolveValue(_this, newValue) {
            try {
                if (newValue === _this) {
                    throw new TypeError("A promise cannot be resolved with itself");
                }

                if (newValue && (isObject(newValue) || isFunction(newValue))) {
                    if (isFunction(newValue.then)) {
                        handleResolve(
                            function resolver(resolve, reject) {
                                newValue.then(resolve, reject);
                            },
                            function resolve(newValue) {
                                resolveValue(_this, newValue);
                            },
                            function reject(newValue) {
                                rejectValue(_this, newValue);
                            }
                        );
                        return;
                    }
                }
                _this.state = true;
                _this.value = newValue;
                finale(_this);
            } catch (err) {
                rejectValue(_this, err);
            }
        }

        function rejectValue(_this, newValue) {
            _this.state = false;
            _this.value = newValue;
            finale(_this);
        }

        function finale(_this) {
            var handlers = _this.handlers,
                i = -1,
                il = handlers.length - 1;

            while (i++ < il) {
                handle(_this, handlers[i]);
            }

            handlers.length = 0;
        }

        function handle(_this, handler) {
            var state = _this.state;

            if (_this.state === null) {
                _this.handlers.push(handler);
                return;
            }

            process.nextTick(function nextTick() {
                var callback = state ? handler.onFulfilled : handler.onRejected,
                    value = _this.value,
                    out;

                if (callback === null) {
                    (state ? handler.resolve : handler.reject)(value);
                    return;
                }

                try {
                    out = callback(value);
                } catch (err) {
                    handler.reject(err);
                    return;
                }

                handler.resolve(out);
            });
        }

        return PrivatePromise;
    }());

    PromisePolyfill = function Promise(resolver) {

        if (!(this instanceof PromisePolyfill)) {
            throw new TypeError("Promise(resolver) \"this\" must be an instance of of Promise");
        }
        if (!isFunction(resolver)) {
            throw new TypeError("Promise(resolver) You must pass a resolver function as the first argument to the promise constructor");
        }

        PrivatePromise.store.set(this, new PrivatePromise(resolver));
    };

    PromisePolyfill.prototype.then = function(onFulfilled, onRejected) {
        var _this = PrivatePromise.store.get(this);

        return new PromisePolyfill(function resolver(resolve, reject) {
            PrivatePromise.handle(_this, onFulfilled, onRejected, resolve, reject);
        });
    };
}


if (!isFunction(PromisePolyfill.prototype["catch"])) {
    PromisePolyfill.prototype["catch"] = function(onRejected) {
        return this.then(null, onRejected);
    };
}

if (!isFunction(PromisePolyfill.resolve)) {
    PromisePolyfill.resolve = function(value) {
        if (value instanceof PromisePolyfill) {
            return value;
        }

        return new PromisePolyfill(function resolver(resolve) {
            resolve(value);
        });
    };
}

if (!isFunction(PromisePolyfill.reject)) {
    PromisePolyfill.reject = function(value) {
        return new PromisePolyfill(function resolver(resolve, reject) {
            reject(value);
        });
    };
}

if (!isFunction(PromisePolyfill.defer)) {
    PromisePolyfill.defer = function() {
        var deferred = {};

        deferred.promise = new PromisePolyfill(function resolver(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        return deferred;
    };
}

if (!isFunction(PromisePolyfill.all)) {
    PromisePolyfill.all = function(value) {
        var args = (arguments.length === 1 && isArray(value)) ? value : fastSlice(arguments);

        return new PromisePolyfill(function resolver(resolve, reject) {
            var length = args.length,
                i = -1,
                il = length - 1;

            if (length === 0) {
                resolve([]);
                return;
            }

            function resolveValue(index, value) {
                try {
                    if (value && (isObject(value) || isFunction(value)) && isFunction(value.then)) {
                        value.then(function(v) {
                            resolveValue(index, v);
                        }, reject);
                        return;
                    }
                    if (--length === 0) {
                        resolve(args);
                    }
                } catch (e) {
                    reject(e);
                }
            }

            while (i++ < il) {
                resolveValue(i, args[i]);
            }
        });
    };
}

if (!isFunction(PromisePolyfill.race)) {
    PromisePolyfill.race = function(values) {
        return new PromisePolyfill(function resolver(resolve, reject) {
            var i = -1,
                il = values.length - 1,
                value;

            while (i++ < il) {
                value = values[i];

                if (value && (isObject(value) || isFunction(value)) && isFunction(value.then)) {
                    value.then(resolve, reject);
                }
            }
        });
    };
}


module.exports = PromisePolyfill;


},
function(require, exports, module, global) {

var has = require(10),
    defineProperty = require(21),
    isPrimitive = require(131);


var emptyObject = {};


module.exports = createStore;


function privateStore(key, privateKey) {
    var store = {
            identity: privateKey
        },
        valueOf = key.valueOf;

    defineProperty(key, "valueOf", {
        value: function(value) {
            return value !== privateKey ? valueOf.apply(this, arguments) : store;
        },
        writable: true
    });

    return store;
}

function createStore() {
    var privateKey = {};

    function get(key) {
        if (isPrimitive(key)) {
            throw new TypeError("Invalid value used as key");
        }

        return key.valueOf(privateKey) || emptyObject;
    }

    function set(key) {
        var store;

        if (isPrimitive(key)) {
            throw new TypeError("Invalid value used as key");
        }

        store = key.valueOf(privateKey);

        if (!store || store.identity !== privateKey) {
            store = privateStore(key, privateKey);
        }

        return store;
    }

    return {
        get: function(key) {
            return get(key).value;
        },
        set: function(key, value) {
            set(key).value = value;
        },
        has: function(key) {
            return has(get(key), "value");
        },
        remove: function(key) {
            var store = get(key);
            return store === emptyObject ? false : delete store.value;
        },
        clear: function() {
            privateKey = {};
        }
    };
}


},
function(require, exports, module, global) {

var isNullOrUndefined = require(19);


module.exports = isPrimitive;


function isPrimitive(obj) {
    var typeStr;
    return isNullOrUndefined(obj) || ((typeStr = typeof(obj)) !== "object" && typeStr !== "function") || false;
}


},
function(require, exports, module, global) {

var extend = require(13),
    environment = require(1);


var window = environment.window,

    ActiveXObject = window.ActiveXObject,

    XMLHttpRequestPolyfill = (
        window.XMLHttpRequest ||
        (function getRequestObjectType(types) {
            var i = -1,
                il = types.length - 1,
                instance, createType;

            while (i++ < il) {
                try {
                    createType = types[i];
                    instance = createType();
                    break;
                } catch (e) {}
            }

            if (!createType) {
                throw new Error("XMLHttpRequest not supported by this browser");
            }

            return function XMLHttpRequest() {
                return createType();
            };
        }([
            function createActiveObject() {
                return new ActiveXObject("Msxml2.XMLHTTP");
            },
            function createActiveObject() {
                return new ActiveXObject("Msxml3.XMLHTTP");
            },
            function createActiveObject() {
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
        ]))
    ),

    XMLHttpRequestPolyfillPrototype = XMLHttpRequestPolyfill.prototype;


if (XMLHttpRequestPolyfillPrototype.setRequestHeader) {
    XMLHttpRequestPolyfillPrototype.nativeSetRequestHeader = XMLHttpRequestPolyfillPrototype.setRequestHeader;

    XMLHttpRequestPolyfillPrototype.setRequestHeader = function setRequestHeader(key, value) {
        (this.__requestHeaders__ || (this.__requestHeaders__ = {}))[key] = value;
        return this.nativeSetRequestHeader(key, value);
    };
}

XMLHttpRequestPolyfillPrototype.getRequestHeader = function getRequestHeader(key) {
    return (this.__requestHeaders__ || (this.__requestHeaders__ = {}))[key];
};

XMLHttpRequestPolyfillPrototype.getRequestHeaders = function getRequestHeaders() {
    return extend({}, this.__requestHeaders__);
};


module.exports = XMLHttpRequestPolyfill;


},
function(require, exports, module, global) {

var isNative = require(15),
    toString = require(17);


var StringPrototype = String.prototype,

    reTrim = /^[\s\xA0]+|[\s\xA0]+$/g,
    reTrimLeft = /^[\s\xA0]+/g,
    reTrimRight = /[\s\xA0]+$/g,

    baseTrim, baseTrimLeft, baseTrimRight;


module.exports = trim;


if (isNative(StringPrototype.trim)) {
    baseTrim = function baseTrim(str) {
        return str.trim();
    };
} else {
    baseTrim = function baseTrim(str) {
        return str.replace(reTrim, "");
    };
}

if (isNative(StringPrototype.trimLeft)) {
    baseTrimLeft = function baseTrimLeft(str) {
        return str.trimLeft();
    };
} else {
    baseTrimLeft = function baseTrimLeft(str) {
        return str.replace(reTrimLeft, "");
    };
}

if (isNative(StringPrototype.trimRight)) {
    baseTrimRight = function baseTrimRight(str) {
        return str.trimRight();
    };
} else {
    baseTrimRight = function baseTrimRight(str) {
        return str.replace(reTrimRight, "");
    };
}


function trim(str) {
    return baseTrim(toString(str));
}

trim.left = function trimLeft(str) {
    return baseTrimLeft(toString(str));
};

trim.right = function trimRight(str) {
    return baseTrimRight(toString(str));
};


},
function(require, exports, module, global) {

module.exports = Response;


function Response() {
    this.data = null;
    this.method = null;
    this.requestHeaders = null;
    this.responseHeaders = null;
    this.statusCode = null;
    this.url = null;
}


},
function(require, exports, module, global) {

var map = require(136),
    capitalizeString = require(137);


module.exports = function camelcaseHeader(str) {
    return map(str.split("-"), capitalizeString).join("-");
};


},
function(require, exports, module, global) {

var keys = require(14),
    isNullOrUndefined = require(19),
    fastBindThis = require(44),
    isArrayLike = require(39);


module.exports = map;


function map(object, callback, thisArg) {
    callback = isNullOrUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 2);
    return isArrayLike(object) ? mapArray(object, callback) : mapObject(object, callback);
}

function mapArray(array, callback) {
    var length = array.length,
        i = -1,
        il = length - 1,
        result = new Array(length);

    while (i++ < il) {
        result[i] = callback(array[i], i);
    }

    return result;
}

function mapObject(object, callback) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        result = {},
        key;

    while (i++ < il) {
        key = objectKeys[i];
        result[key] = callback(object[key], key);
    }

    return result;
}


},
function(require, exports, module, global) {

module.exports = capitalizeString;


function capitalizeString(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


},
function(require, exports, module, global) {

module.exports = function parseContentType(str) {
    var index;

    if (str) {
        if ((index = str.indexOf(";")) !== -1) {
            str = str.substring(0, index);
        }
        if ((index = str.indexOf(",")) !== -1) {
            return str.substring(0, index);
        }

        return str;
    }

    return "application/octet-stream";
};


},
function(require, exports, module, global) {

var vec2 = require(64),
    WebGLContext = require(31),
    ImageAsset = require(120);


var ImageAssetPrototype = ImageAsset.prototype,

    enums = WebGLContext.enums,
    filterMode = enums.filterMode,
    textureFormat = enums.textureFormat,
    textureWrap = enums.textureWrap,
    textureType = enums.textureType,

    TexturePrototype;


module.exports = Texture;


function Texture() {

    ImageAsset.call(this);

    this.width = null;
    this.height = null;

    this.__invWidth = null;
    this.__invHeight = null;

    this.offset = vec2.create();
    this.repeat = vec2.create(1, 1);

    this.generateMipmap = null;
    this.flipY = null;
    this.premultiplyAlpha = null;

    this.anisotropy = null;

    this.filter = null;
    this.format = null;
    this.wrap = null;
    this.type = null;
}
ImageAsset.extend(Texture, "odin.Texture");
TexturePrototype = Texture.prototype;

TexturePrototype.construct = function(name, src, options) {

    ImageAssetPrototype.construct.call(this, name, src);

    options = options || {};

    this.generateMipmap = options.generateMipmap != null ? !!options.generateMipmap : true;
    this.flipY = options.flipY != null ? !!options.flipY : false;
    this.premultiplyAlpha = options.premultiplyAlpha != null ? !!options.premultiplyAlpha : false;

    this.anisotropy = options.anisotropy != null ? options.anisotropy : 1;

    this.filter = options.filter != null ? options.filter : filterMode.Linear;
    this.format = options.format != null ? options.format : textureFormat.RGBA;
    this.wrap = options.wrap != null ? options.wrap : textureWrap.Repeat;
    this.type = options.type != null ? options.type : textureType.UnsignedByte;

    return this;
};

TexturePrototype.destructor = function() {

    ImageAssetPrototype.destructor.call(this);

    this.width = null;
    this.height = null;

    this.__invWidth = null;
    this.__invHeight = null;

    vec2.set(this.offset, 0, 0);
    vec2.set(this.repeat, 1, 1);

    this.generateMipmap = null;
    this.flipY = null;
    this.premultiplyAlpha = null;

    this.anisotropy = null;

    this.filter = null;
    this.format = null;
    this.wrap = null;
    this.type = null;

    return this;
};

TexturePrototype.parse = function() {
    var data = this.data;

    if (data != null) {
        this.setSize(data.width || 1, data.height || 1);
    }

    ImageAssetPrototype.parse.call(this);

    return this;
};

TexturePrototype.setSize = function(width, height) {

    this.width = width;
    this.height = height;

    this.__invWidth = 1 / this.width;
    this.__invHeight = 1 / this.height;

    this.emit("update");

    return this;
};

TexturePrototype.setOffset = function(x, y) {

    vec2.set(this.offset, x, y);
    this.emit("update");

    return this;
};

TexturePrototype.setRepeat = function(x, y) {

    vec2.set(this.repeat, x, y);
    this.emit("update");

    return this;
};

TexturePrototype.setMipmap = function(value) {

    this.generateMipmap = value != null ? !!value : this.generateMipmap;
    this.emit("update");

    return this;
};

TexturePrototype.setAnisotropy = function(value) {

    this.anisotropy = value;
    this.emit("update");

    return this;
};

TexturePrototype.setFilter = function(value) {

    this.filter = value;
    this.emit("update");

    return this;
};

TexturePrototype.setFormat = function(value) {

    this.format = value;
    this.emit("update");

    return this;
};

TexturePrototype.setWrap = function(value) {

    this.wrap = value;
    this.emit("update");

    return this;
};

TexturePrototype.setType = function(value) {

    this.type = value;
    this.emit("update");

    return this;
};


},
function(require, exports, module, global) {

var JSONAsset = require(123),
    Shader = require(141),
    enums = require(30);


var JSONAssetPrototype = JSONAsset.prototype,
    MaterialPrototype;


module.exports = Material;


function Material() {

    JSONAsset.call(this);

    this.shader = null;

    this.side = null;
    this.blending = null;

    this.wireframe = null;
    this.wireframeLineWidth = null;

    this.receiveShadow = null;
    this.castShadow = null;

    this.uniforms = null;
}
JSONAsset.extend(Material, "odin.Material");
MaterialPrototype = Material.prototype;

MaterialPrototype.construct = function(name, src, options) {

    JSONAssetPrototype.construct.call(this, name, src);

    options = options || {};

    if (options.shader) {
        this.shader = options.shader;
    } else {
        if (options.vertex && options.fragment) {
            this.shader = Shader.create(options.vertex, options.fragment);
        }
    }

    this.uniforms = options.uniforms || {};

    this.side = options.side != null ? options.side : enums.side.FRONT;
    this.blending = options.blending != null ? options.blending : enums.blending.DEFAULT;

    this.wireframe = options.wireframe != null ? !!options.wireframe : false;
    this.wireframeLineWidth = options.wireframeLineWidth != null ? options.wireframeLineWidth : 1;

    this.receiveShadow = options.receiveShadow != null ? !!options.receiveShadow : true;
    this.castShadow = options.castShadow != null ? !!options.castShadow : true;

    return this;
};

MaterialPrototype.destructor = function() {

    JSONAssetPrototype.destructor.call(this);

    this.side = null;
    this.blending = null;

    this.wireframe = null;
    this.wireframeLineWidth = null;

    this.receiveShadow = null;
    this.castShadow = null;

    this.uniforms = null;

    return this;
};

MaterialPrototype.parse = function() {
    JSONAssetPrototype.parse.call(this);
    return this;
};


},
function(require, exports, module, global) {

var map = require(136),
    keys = require(14),
    template = require(142),
    pushUnique = require(143),
    Class = require(9),
    chunks = require(144);


var ClassPrototype = Class.prototype,

    VERTEX = "vertex",
    FRAGMENT = "fragment",

    chunkRegExps = map(keys(chunks), function(key) {
        return {
            key: key,
            regexp: new RegExp("\\b" + key + "\\b")
        };
    }),

    ShaderPrototype;


module.exports = Shader;


function Shader() {

    Class.call(this);

    this.vertex = null;
    this.fragment = null;
    this.templateVariables = [];
}
Class.extend(Shader, "odin.Shader");
ShaderPrototype = Shader.prototype;

ShaderPrototype.construct = function(vertex, fragment) {

    ClassPrototype.construct.call(this);

    if (vertex && fragment) {
        this.set(vertex, fragment);
    }

    return this;
};

ShaderPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.vertex = null;
    this.fragment = null;
    this.templateVariables.length = 0;

    return this;
};

ShaderPrototype.set = function(vertex, fragment) {

    this.templateVariables.length = 0;
    this.vertex = Shader_compile(this, vertex, VERTEX);
    this.fragment = Shader_compile(this, fragment, FRAGMENT);

    return this;
};

function Shader_compile(_this, shader, type) {
    var templateVariables = _this.templateVariables,
        shaderChunks = [],
        out = "",
        i = -1,
        il = chunkRegExps.length - 1,
        chunkRegExp;

    while (i++ < il) {
        chunkRegExp = chunkRegExps[i];

        if (chunkRegExp.regexp.test(shader)) {
            requireChunk(shaderChunks, templateVariables, chunks[chunkRegExp.key], type);
        }
    }

    i = -1;
    il = shaderChunks.length - 1;
    while (i++ < il) {
        out += shaderChunks[i].code;
    }

    return template(out + "\n" + shader);
}

function requireChunk(shaderChunks, templateVariables, chunk, type) {
    var requires, i, il;

    if (
        type === VERTEX && chunk.vertex ||
        type === FRAGMENT && chunk.fragment
    ) {
        requires = chunk.requires;
        i = -1;
        il = requires.length - 1;

        while (i++ < il) {
            requireChunk(shaderChunks, templateVariables, chunks[requires[i]], type);
        }

        pushUnique(shaderChunks, chunk);

        if (chunk.template) {
            pushUnique.array(templateVariables, chunk.template);
        }
    }
}


},
function(require, exports, module, global) {

var reEscaper = /\\|'|\r|\n|\t|\u2028|\u2029/g,
    ESCAPES = {
        "'": "'",
        "\\": "\\",
        "\r": "r",
        "\n": "n",
        "\t": "t",
        "\u2028": "u2028",
        "\u2029": "u2029"
    };


module.exports = template;


function template(text, data, settings) {
    var templateSettings = template.settings,

        match = "([\\s\\S]+?)",
        source = "__p+='",
        index = 0,

        render, start, end, evaluate, interpolate, escape;

    settings || (settings = {});

    for (var key in templateSettings) {
        if (settings[key] == null) settings[key] = templateSettings[key];
    }

    start = settings.start;
    end = settings.end;

    evaluate = start + match + end;
    interpolate = start + "=" + match + end;
    escape = start + "-" + match + end;

    text.replace(
        new RegExp(escape + "|" + interpolate + "|" + evaluate + "|$", "g"),
        function(match, escape, interpolate, evaluate, offset) {

            source += text.slice(index, offset).replace(reEscaper, function(match) {
                return '\\' + ESCAPES[match];
            });

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':escape(__t))+\n'";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            index = offset + match.length;

            return match;
        }
    );
    source += "';\n";

    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join;\n" + source + "return __p;\n";

    try {
        render = new Function(settings.variable || 'obj', source);
    } catch (e) {
        e.source = source;
        throw e;
    }

    return data != null ? render(data) : function temp(data) {
        return render.call(this, data);
    };
}

template.settings = {
    start: "<%",
    end: "%>",
    interpolate: "=",
    escape: "-"
};


},
function(require, exports, module, global) {

var indexOf = require(57);


module.exports = pushUnique;

function pushUnique(array) {
    var i = 0,
        il = arguments.length - 1;

    while (i++ < il) {
        basePushUnique(array, arguments[i]);
    }

    return array;
}

pushUnique.array = function(array, values) {
    var i = -1,
        il = values.length - 1;

    while (i++ < il) {
        basePushUnique(array, values[i]);
    }

    return array;
};

function basePushUnique(array, value) {
    if (indexOf(array, value) === -1) {
        array[array.length] = value;
    }
}


},
function(require, exports, module, global) {

var ShaderChunk = require(145);


var chunks = exports;

chunks.perspectiveMatrix = ShaderChunk.create({
    code: "uniform mat4 perspectiveMatrix;\n"
});

chunks.modelViewMatrix = ShaderChunk.create({
    code: "uniform mat4 modelViewMatrix;\n"
});

chunks.normalMatrix = ShaderChunk.create({
    code: "uniform mat3 normalMatrix;\n"
});

chunks.size = ShaderChunk.create({
    code: "uniform vec2 size;\n"
});

chunks.clipping = ShaderChunk.create({
    code: "uniform vec4 clipping;\n"
});

chunks.position = ShaderChunk.create({
    code: "attribute vec3 position;\n",
    fragment: false
});

chunks.normal = ShaderChunk.create({
    code: "attribute vec3 normal;\n",
    fragment: false
});

chunks.tangent = ShaderChunk.create({
    code: "attribute vec4 tangent;\n",
    fragment: false
});

chunks.color = ShaderChunk.create({
    code: "attribute vec3 color;\n",
    fragment: false
});

chunks.uv = ShaderChunk.create({
    code: "attribute vec2 uv;\n",
    fragment: false
});

chunks.uv2 = ShaderChunk.create({
    code: "attribute vec2 uv2;\n",
    fragment: false
});

chunks.boneWeight = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "attribute vec<%= boneWeightCount %> boneWeight;",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"],
    fragment: false
});

chunks.boneIndex = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "attribute vec<%= boneWeightCount %> boneIndex;",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"],
    fragment: false
});

chunks.normalMatrix = ShaderChunk.create({
    code: "uniform mat3 normalMatrix;\n"
});

chunks.boneMatrix = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "uniform mat4 boneMatrix[<%= boneCount %>];",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneCount"]
});

chunks.dHdxy_fwd = ShaderChunk.create({
    code: [
        "vec2 dHdxy_fwd(sampler2D map, vec2 uv, float scale) {",

        "    vec2 dSTdx = dFdx(uv);",
        "    vec2 dSTdy = dFdy(uv);",

        "    float Hll = scale * texture2D(map, uv).x;",
        "    float dBx = scale * texture2D(map, uv + dSTdx).x - Hll;",
        "    float dBy = scale * texture2D(map, uv + dSTdy).x - Hll;",

        "    return vec2(dBx, dBy);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.perturbNormalArb = ShaderChunk.create({
    code: [
        "vec3 perturbNormalArb(vec3 surf_position, vec3 surf_normal, vec2 dHdxy) {",

        "    vec3 vSigmaX = dFdx(surf_position);",
        "    vec3 vSigmaY = dFdy(surf_position);",
        "    vec3 vN = surf_normal;",

        "    vec3 R1 = cross(vSigmaY, vN);",
        "    vec3 R2 = cross(vN, vSigmaX);",

        "    float fDet = dot(vSigmaX, R1);",
        "    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);",

        "    return normalize(abs(fDet) * surf_normal - vGrad);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.perturbNormal2Arb = ShaderChunk.create({
    code: [
        "vec3 perturbNormal2Arb(sampler2D map, vec2 uv, vec3 eye_position, vec3 surf_normal, float scale) {",

        "    vec3 q0 = dFdx(eye_position.xyz);",
        "    vec3 q1 = dFdy(eye_position.xyz);",
        "    vec2 st0 = dFdx(uv.st);",
        "    vec2 st1 = dFdy(uv.st);",

        "    vec3 S = normalize(q0 * st1.t - q1 * st0.t);",
        "    vec3 T = normalize(-q0 * st1.s + q1 * st0.s);",
        "    vec3 N = normalize(surf_normal);",

        "    vec3 mapN = texture2D(map, uv).xyz * 2.0 - 1.0;",
        "    mapN.xy = scale * mapN.xy;",
        "    mat3 tsn = mat3(S, T, N);",

        "    return normalize(tsn * mapN);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.getBoneMatrix = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "mat4 getBoneMatrix_result;",
        "bool getBoneMatrix_bool = false;",
        "mat4 getBoneMatrix() {",
        "    if (getBoneMatrix_bool == false) {",
        "        getBoneMatrix_bool = true;",
        "        getBoneMatrix_result = boneWeight.x * boneMatrix[int(boneIndex.x)];",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.y * boneMatrix[int(boneIndex.y)];",
        "        <% if (boneWeightCount > 2) { %>",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.z * boneMatrix[int(boneIndex.z)];",
        "        <% } %>",
        "        <% if (boneWeightCount > 3) { %>",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.w * boneMatrix[int(boneIndex.w)];",
        "        <% } %>",
        "    }",
        "    return getBoneMatrix_result;",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"],
    requires: ["boneWeight", "boneIndex", "boneMatrix"],
    fragment: false
});

chunks.getBonePosition = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "vec4 getBonePosition() {",
        "    return getBoneMatrix() * vec4(position, 1.0);",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones"],
    requires: ["getBoneMatrix", "position"],
    fragment: false
});

chunks.getPosition = ShaderChunk.create({
    code: [
        "vec4 getPosition_result;",
        "bool getPosition_bool = false;",
        "vec4 getPosition() {",
        "    if (getPosition_bool == false) {",
        "        getPosition_bool = true;",
        "        <% if (useBones) { %>",
        "        getPosition_result = getBonePosition();",
        "        <% } else if (isSprite) { %>",
        "        getPosition_result = vec4(position.x * size.x, position.y * size.y, position.z, 1.0);",
        "        <% } else { %>",
        "        getPosition_result = vec4(position, 1.0);",
        "        <% } %>",
        "    }",
        "    return getPosition_result;",
        "}",
        ""
    ].join("\n"),
    template: ["useBones", "isSprite"],
    requires: ["size", "getBonePosition", "position"],
    fragment: false
});

chunks.getBoneNormal = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "vec4 getBoneNormal() {",
        "    return getBoneMatrix() * vec4(normal, 0.0);",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    requires: ["getBoneMatrix", "normal"],
    fragment: false
});

chunks.getNormal = ShaderChunk.create({
    code: [
        "vec3 getNormal_result;",
        "bool getNormal_bool = false;",
        "vec3 getNormal() {",
        "    if (getNormal_bool == false) {",
        "        getNormal_bool = true;",
        "        <% if (useBones) { %>",
        "        getNormal_result = normalMatrix * getBoneNormal().xyz;",
        "        <% } else { %>",
        "        getNormal_result = normalMatrix * normal;",
        "        <% } %>",
        "    }",
        "    return getNormal_result;",
        "}",
        ""
    ].join("\n"),
    template: ["useBones"],
    requires: ["getBoneNormal", "normalMatrix", "normal"],
    fragment: false
});

chunks.getUV = ShaderChunk.create({
    code: [
        "vec2 getUV() {",
        "    <% if (isSprite) { %>",
        "    return clipping.xy + (uv * clipping.zw);",
        "    <% } else { %>",
        "    return uv;",
        "    <% } %>",
        "}",
        ""
    ].join("\n"),
    template: ["isSprite"],
    requires: ["clipping", "uv"],
    fragment: false
});


},
function(require, exports, module, global) {

var isArray = require(54);


var ShaderChunkPrototype;


module.exports = ShaderChunk;


function ShaderChunk() {
    this.code = null;
    this.template = null;
    this.vertex = null;
    this.fragment = null;
    this.requires = null;
    this.extensions = null;
}
ShaderChunkPrototype = ShaderChunk.prototype;

ShaderChunk.create = function(options) {
    return (new ShaderChunk()).construct(options);
};

ShaderChunkPrototype.construct = function(options) {

    options = options || {};

    this.code = options.code;
    this.template = options.template;
    this.vertex = options.vertex != null ? !!options.vertex : true;
    this.fragment = options.fragment != null ? !!options.fragment : true;
    this.requires = isArray(options.requires) ? options.requires : [];
    this.extensions = isArray(options.extensions) ? options.extensions : [];

    return this;
};

ShaderChunkPrototype.destructor = function() {

    this.code = null;
    this.template = null;
    this.vertex = null;
    this.fragment = null;
    this.requires = null;
    this.extensions = null;

    return this;
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    quat = require(147),
    mat4 = require(76),
    mathf = require(32),
    aabb3 = require(148),
    FastHash = require(56),
    Attribute = require(149),
    JSONAsset = require(123),
    GeometryBone = require(150);


var JSONAssetPrototype = JSONAsset.prototype,
    NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array,
    NativeUint16Array = typeof(Uint16Array) !== "undefined" ? Uint16Array : Array,
    GeometryPrototype;


module.exports = Geometry;


function Geometry() {

    JSONAsset.call(this);

    this.index = null;
    this.bones = [];

    this.attributes = new FastHash("name");
    this.aabb = aabb3.create();

    this.boundingCenter = vec3.create();
    this.boundingRadius = 0;

    this.boneWeightCount = 3;
}
JSONAsset.extend(Geometry, "odin.Geometry");
GeometryPrototype = Geometry.prototype;

GeometryPrototype.construct = function(name, src, options) {

    JSONAssetPrototype.construct.call(this, name, src, options);

    return this;
};

GeometryPrototype.destructor = function() {

    JSONAssetPrototype.destructor.call(this);

    this.index = null;
    this.bones.length = 0;

    this.attributes.clear();
    aabb3.clear(this.aabb);

    vec3.set(this.boundingCenter, 0, 0, 0);
    this.boundingRadius = 0;

    return this;
};

GeometryPrototype.getAttribute = function(name) {
    return this.attributes.get(name);
};

GeometryPrototype.addAttribute = function(name, length, itemSize, ArrayType, dynamic, items) {
    this.attributes.add(Attribute.create(this, name, length, itemSize, ArrayType, dynamic, items));
    return this;
};

GeometryPrototype.removeAttribute = function(name) {
    this.attributes.remove(name);
    return this;
};

GeometryPrototype.parse = function() {
    var data = this.data,
        dataBones = data.bones,
        bones = this.bones,
        items, i, il, bone, dataBone;

    if ((items = (data.index || data.indices || data.faces)) && items.length) {
        this.index = new NativeUint16Array(items);
    }
    if (data.boneWeightCount) {
        this.boneWeightCount = data.boneWeightCount;
    } else {
        data.boneWeightCount = 3;
    }

    if ((items = (data.position || data.vertices)) && items.length) {
        this.addAttribute("position", items.length, 3, NativeFloat32Array, false, items);
    }
    if ((items = (data.normal || data.normals)) && items.length) {
        this.addAttribute("normal", items.length, 3, NativeFloat32Array, false, items);
    }
    if ((items = (data.tangent || data.tangents)) && items.length) {
        this.addAttribute("tangent", items.length, 4, NativeFloat32Array, false, items);
    }
    if ((items = (data.color || data.colors)) && items.length) {
        this.addAttribute("color", items.length, 3, NativeFloat32Array, false, items);
    }
    if ((items = (data.uv || data.uvs)) && items.length) {
        this.addAttribute("uv", items.length, 2, NativeFloat32Array, false, items);
    }
    if ((items = (data.uv2 || data.uvs2)) && items.length) {
        this.addAttribute("uv2", items.length, 2, NativeFloat32Array, false, items);
    }
    if ((items = (data.boneWeight || data.boneWeights)) && items.length) {
        this.addAttribute("boneWeight", items.length, this.boneWeightCount, NativeFloat32Array, false, items);
    }
    if ((items = (data.boneIndex || data.boneIndices)) && items.length) {
        this.addAttribute("boneIndex", items.length, this.boneWeightCount, NativeFloat32Array, false, items);
    }

    i = -1;
    il = dataBones.length - 1;
    while (i++ < il) {
        dataBone = dataBones[i];
        bone = GeometryBone.create(dataBone.parent, dataBone.name);

        vec3.copy(bone.position, dataBone.position);
        quat.copy(bone.rotation, dataBone.rotation);
        vec3.copy(bone.scale, dataBone.scale);
        mat4.copy(bone.bindPose, dataBone.bindPose);
        bone.skinned = !!dataBone.skinned;

        bones[bones.length] = bone;
    }

    this.calculateAABB();
    this.calculateBoundingSphere();

    JSONAssetPrototype.parse.call(this);

    return this;
};

GeometryPrototype.calculateAABB = function() {
    var position = this.attributes.__hash.position;

    if (position) {
        aabb3.fromPointArray(this.aabb, position.array);
    }
    return this;
};

GeometryPrototype.calculateBoundingSphere = function() {
    var position = this.attributes.__hash.position,
        bx = 0,
        by = 0,
        bz = 0,
        maxRadiusSq, maxRadiusSqTest, x, y, z, array, i, il, invLength;

    if (position) {
        array = position.array;
        maxRadiusSq = 0;

        i = 0;
        il = array.length;

        while (i < il) {
            x = array[i];
            y = array[i + 1];
            z = array[i + 2];

            bx += x;
            by += y;
            bz += z;

            maxRadiusSqTest = x * x + y * y + z * z;

            if (maxRadiusSq < maxRadiusSqTest) {
                maxRadiusSq = maxRadiusSqTest;
            }

            i += 3;
        }

        invLength = il === 0 ? 0 : 1 / il;
        bx *= invLength;
        by *= invLength;
        bz *= invLength;

        vec3.set(this.boundingCenter, bx, by, bz);
        this.boundingRadius = maxRadiusSq !== 0 ? mathf.sqrt(maxRadiusSq) : 0;
    }

    return this;
};

var calculateNormals_u = vec3.create(),
    calculateNormals_v = vec3.create(),
    calculateNormals_uv = vec3.create(),

    calculateNormals_va = vec3.create(),
    calculateNormals_vb = vec3.create(),
    calculateNormals_vc = vec3.create(),

    calculateNormals_faceNormal = vec3.create();

GeometryPrototype.calculateNormals = function() {
    var u = calculateNormals_u,
        v = calculateNormals_v,
        uv = calculateNormals_uv,
        faceNormal = calculateNormals_faceNormal,

        va = calculateNormals_va,
        vb = calculateNormals_vb,
        vc = calculateNormals_vc,

        attributes = this.attributes,
        attributesHash = attributes.__hash,
        position = attributesHash.position,
        normal = attributesHash.normal,
        index = this.index,
        x, y, z, nx, ny, nz, length, i, il, a, b, c, n;

    position = position ? position.array : null;

    if (position == null) {
        throw new Error("Geometry.calculateNormals: missing required attribures position");
    }
    if (index == null) {
        throw new Error("Geometry.calculateNormals: missing required attribures index");
    }

    length = position.length;

    if (normal == null) {
        this.addAttribute("normal", length, 3, NativeFloat32Array);
        normal = attributesHash.normal.array;
    } else {
        normal = normal.array;
        i = -1;
        il = length - 1;
        while (i++ < il) {
            normal[i] = 0;
        }
    }

    if (index) {
        i = 0;
        il = length;

        while (i < il) {
            a = index[i];
            b = index[i + 1];
            c = index[i + 2];

            x = position[a * 3];
            y = position[a * 3 + 1];
            z = position[a * 3 + 2];
            vec3.set(va, x, y, z);

            x = position[b * 3];
            y = position[b * 3 + 1];
            z = position[b * 3 + 2];
            vec3.set(vb, x, y, z);

            x = position[c * 3];
            y = position[c * 3 + 1];
            z = position[c * 3 + 2];
            vec3.set(vc, x, y, z);

            vec3.sub(u, vc, vb);
            vec3.sub(v, va, vb);

            vec3.cross(uv, u, v);

            vec3.copy(faceNormal, uv);
            vec3.normalize(faceNormal, faceNormal);
            nx = faceNormal[0];
            ny = faceNormal[1];
            nz = faceNormal[2];

            normal[a * 3] += nx;
            normal[a * 3 + 1] += ny;
            normal[a * 3 + 2] += nz;

            normal[b * 3] += nx;
            normal[b * 3 + 1] += ny;
            normal[b * 3 + 2] += nz;

            normal[c * 3] += nx;
            normal[c * 3 + 1] += ny;
            normal[c * 3 + 2] += nz;

            i += 3;
        }

        i = 0;
        il = length;

        while (i < il) {
            x = normal[i];
            y = normal[i + 1];
            z = normal[i + 2];

            n = 1 / mathf.sqrt(x * x + y * y + z * z);

            normal[i] *= n;
            normal[i + 1] *= n;
            normal[i + 2] *= n;

            i += 3;
        }

        this.emit("update");
    }

    return this;
};

var calculateTangents_tan1 = [],
    calculateTangents_tan2 = [],
    calculateTangents_sdir = vec3.create(),
    calculateTangents_tdir = vec3.create(),
    calculateTangents_n = vec3.create(),
    calculateTangents_t = vec3.create(),
    calculateTangents_tmp1 = vec3.create(),
    calculateTangents_tmp2 = vec3.create(),
    calculateTangents_tmp3 = vec3.create();
GeometryPrototype.calculateTangents = function() {
    var tan1 = calculateTangents_tan1,
        tan2 = calculateTangents_tan2,
        sdir = calculateTangents_sdir,
        tdir = calculateTangents_tdir,
        n = calculateTangents_n,
        t = calculateTangents_t,
        tmp1 = calculateTangents_tmp1,
        tmp2 = calculateTangents_tmp2,
        tmp3 = calculateTangents_tmp3,

        attributes = this.attributes,
        index = this.index,
        attributeHash = attributes.__hash,
        position = attributeHash.position,
        normal = attributeHash.normal,
        tangent = attributeHash.tangent,
        uv = attributeHash.uv,

        v1 = tmp1,
        v2 = tmp2,
        v3 = tmp3,
        w1x, w1y, w2x, w2y, w3x, w3y,

        x1, x2, y1, y2, z1, z2,
        s1, s2, t1, t2,
        a, b, c, x, y, z,

        length, r, w, i, il, j, tmp;

    position = position ? position.array : null;
    uv = uv ? uv.array : null;
    normal = normal ? normal.array : null;

    if (normal == null) {
        throw new Error("Geometry.calculateTangents: missing required attribure normal");
    }
    if (uv == null) {
        throw new Error("Geometry.calculateTangents: missing required attribure uv");
    }
    if (index == null) {
        throw new Error("Geometry.calculateTangents: missing indices");
    }
    if (position == null) {
        throw new Error("Geometry.calculateTangents: missing required attribure position");
    }

    length = position.length;

    if (tangent == null) {
        this.addAttribute("tangent", (4 / 3) * length, 4, NativeFloat32Array);
        tangent = attributeHash.tangent.array;
    } else {
        tangent = tangent.array;
        i = -1;
        il = length - 1;
        while (i++ < il) {
            tangent[i] = 0;
        }
    }

    i = -1;
    il = length - 1;
    while (i++ < il) {
        vec3.set(tan1[i] || (tan1[i] = vec3.create()), 0, 0, 0);
        vec3.set(tan2[i] || (tan2[i] = vec3.create()), 0, 0, 0);
    }

    i = 0;
    il = length / 3;

    while (i < il) {
        a = index[i];
        b = index[i + 1];
        c = index[i + 2];

        x = position[a * 3];
        y = position[a * 3 + 1];
        z = position[a * 3 + 2];
        vec3.set(v1, x, y, z);

        x = position[b * 3];
        y = position[b * 3 + 1];
        z = position[b * 3 + 2];
        vec3.set(v2, x, y, z);

        x = position[c * 3];
        y = position[c * 3 + 1];
        z = position[c * 3 + 2];
        vec3.set(v3, x, y, z);

        w1x = uv[a];
        w1y = uv[a + 1];
        w2x = uv[b];
        w2y = uv[b + 1];
        w3x = uv[c];
        w3y = uv[c + 1];

        x1 = v2[0] - v1[0];
        x2 = v3[0] - v1[0];
        y1 = v2[1] - v1[1];
        y2 = v3[1] - v1[1];
        z1 = v2[2] - v1[2];
        z2 = v3[2] - v1[2];

        s1 = w2x - w1x;
        s2 = w3x - w1x;
        t1 = w2y - w1y;
        t2 = w3y - w1y;

        r = s1 * t2 - s2 * t1;
        r = r !== 0 ? 1 / r : 0;

        vec3.set(
            sdir, (t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r
        );

        vec3.set(
            tdir, (s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r
        );

        tmp = tan1[a];
        vec3.add(tmp, tmp, sdir);
        tmp = tan1[b];
        vec3.add(tmp, tmp, sdir);
        tmp = tan1[c];
        vec3.add(tmp, tmp, sdir);

        tmp = tan2[a];
        vec3.add(tmp, tmp, tdir);
        tmp = tan2[b];
        vec3.add(tmp, tmp, tdir);
        tmp = tan2[c];
        vec3.add(tmp, tmp, tdir);

        i += 3;
    }

    j = 0;
    i = 0;
    il = length;

    while (i < il) {
        vec3.copy(t, tan1[i]);

        n[0] = normal[i];
        n[1] = normal[i + 1];
        n[2] = normal[i + 2];

        vec3.copy(tmp1, t);
        vec3.sub(tmp1, tmp1, vec3.smul(n, n, vec3.dot(n, t)));
        vec3.normalize(tmp1, tmp1);

        n[0] = normal[i];
        n[1] = normal[i + 1];
        n[2] = normal[i + 2];
        vec3.cross(tmp2, n, t);

        w = (vec3.dot(tmp2, tan2[i]) < 0.0) ? -1.0 : 1.0;

        tangent[j] = tmp1[0];
        tangent[j + 1] = tmp1[1];
        tangent[j + 2] = tmp1[2];
        tangent[j + 3] = w;

        j += 4;
        i += 3;
    }

    this.emit("update");

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32),
    vec3 = require(36),
    vec4 = require(67);


var quat = exports;


quat.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


quat.create = function(x, y, z, w) {
    var out = new quat.ArrayType(4);

    out[0] = x !== undefined ? x : 0;
    out[1] = y !== undefined ? y : 0;
    out[2] = z !== undefined ? z : 0;
    out[3] = w !== undefined ? w : 1;

    return out;
};

quat.copy = vec4.copy;

quat.clone = function(a) {
    var out = new quat.ArrayType(4);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];

    return out;
};

quat.set = vec4.set;

quat.lengthSqValues = vec4.lengthSqValues;

quat.lengthValues = vec4.lengthValues;

quat.invLengthValues = vec4.invLengthValues;

quat.dot = vec4.dot;

quat.lengthSq = vec4.lengthSq;

quat.length = vec4.length;

quat.invLength = vec4.invLength;

quat.setLength = vec4.setLength;

quat.normalize = vec4.normalize;

quat.lerp = vec4.lerp;

quat.min = vec4.min;

quat.max = vec4.max;

quat.clamp = vec4.clamp;

quat.equal = vec4.equal;

quat.notEqual = vec4.notEqual;

quat.str = function(out) {

    return "Quat(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
};


quat.mul = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;

    return out;
};

quat.div = function(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        bx = -b[0],
        by = -b[1],
        bz = -b[2],
        bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;

    return out;
};

quat.inverse = function(out, a) {
    var d = quat.dot(a, a);

    d = d !== 0 ? 1 / d : d;

    out[0] = a[0] * -d;
    out[1] = a[1] * -d;
    out[2] = a[2] * -d;
    out[3] = a[3] * d;

    return out;
};

quat.conjugate = function(out, a) {

    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];

    return out;
};

quat.calculateW = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -mathf.sqrt(mathf.abs(1 - x * x - y * y - z * z));

    return out;
};

quat.nlerp = function(out, a, b, x) {

    return quat.normalize(quat.lerp(out, a, b, x));
};

quat.slerp = function(out, a, b, x) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3],

        cosom = ax * bx + ay * by + az * bz + aw * bw,
        omega, sinom, scale0, scale1;

    if (cosom < 0.0) {
        cosom *= -1;
        bx *= -1;
        by *= -1;
        bz *= -1;
        bw *= -1;
    }

    if (1 - cosom > mathf.EPSILON) {
        omega = mathf.acos(cosom);

        sinom = mathf.sin(omega);
        sinom = sinom !== 0 ? 1 / sinom : sinom;

        scale0 = mathf.sin((1 - x) * omega) * sinom;
        scale1 = mathf.sin(x * omega) * sinom;
    } else {
        scale0 = 1 - x;
        scale1 = x;
    }

    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;

    return out;
};

quat.rotationX = function(out) {
    var z = out[2],
        w = out[3];

    return mathf.atan2(2 * out[0] * w + 2 * out[1] * z, 1 - 2 * (z * z + w * w));
};

quat.rotationY = function(out) {
    var theta = 2 * (out[0] * out[2] + out[3] * out[1]);

    return mathf.asin((theta < -1 ? -1 : theta > 1 ? 1 : theta));
};

quat.rotationZ = function(out) {
    var y = out[1],
        z = out[2];

    return mathf.atan2(2 * out[0] * y + 2 * z * out[3], 1 - 2 * (y * y + z * z));
};

quat.rotateX = function(out, a, angle) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        halfAngle = angle * 0.5,
        bx = mathf.sin(halfAngle),
        bw = mathf.cos(halfAngle);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;

    return out;
};

quat.rotateY = function(out, a, angle) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        halfAngle = angle * 0.5,
        by = Math.sin(halfAngle),
        bw = Math.cos(halfAngle);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;

    return out;
};

quat.rotateZ = function(out, a, angle) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3],
        halfAngle = angle * 0.5,
        bz = Math.sin(halfAngle),
        bw = Math.cos(halfAngle);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;

    return out;
};

quat.rotate = function(out, a, x, y, z) {

    if (z !== undefined) {
        quat.rotateZ(out, a, z);
    }
    if (x !== undefined) {
        quat.rotateX(out, a, x);
    }
    if (y !== undefined) {
        quat.rotateY(out, a, y);
    }

    return out;
};

var lookRotation_up = vec3.create(0, 0, 1);
quat.lookRotation = function(out, forward, up) {
    var fx, fy, fz, ux, uy, uz, ax, ay, az, d, dsq, s;

    up = up || lookRotation_up;

    fx = forward[0];
    fy = forward[1];
    fz = forward[2];
    ux = up[0];
    uy = up[1];
    uz = up[2];

    ax = uy * fz - uz * fy;
    ay = uz * fx - ux * fz;
    az = ux * fy - uy * fx;

    d = (1 + ux * fx + uy * fy + uz * fz) * 2;
    dsq = d * d;
    s = dsq !== 0 ? 1 / dsq : dsq;

    out[0] = ax * s;
    out[1] = ay * s;
    out[2] = az * s;
    out[3] = dsq * 0.5;

    return out;
};

quat.fromAxisAngle = function(out, axis, angle) {
    var halfAngle = angle * 0.5,
        s = mathf.sin(halfAngle);

    out[0] = axis[0] * s;
    out[1] = axis[1] * s;
    out[2] = axis[2] * s;
    out[3] = mathf.cos(halfAngle);

    return out;
};

quat.fromMat = function(
    out,
    m11, m12, m13,
    m21, m22, m23,
    m31, m32, m33
) {
    var trace = m11 + m22 + m33,
        s, invS;

    if (trace > 0) {
        s = 0.5 / mathf.sqrt(trace + 1);

        out[3] = 0.25 / s;
        out[0] = (m32 - m23) * s;
        out[1] = (m13 - m31) * s;
        out[2] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        s = 2 * mathf.sqrt(1 + m11 - m22 - m33);
        invS = 1 / s;

        out[3] = (m32 - m23) * invS;
        out[0] = 0.25 * s;
        out[1] = (m12 + m21) * invS;
        out[2] = (m13 + m31) * invS;
    } else if (m22 > m33) {
        s = 2 * mathf.sqrt(1 + m22 - m11 - m33);
        invS = 1 / s;

        out[3] = (m13 - m31) * invS;
        out[0] = (m12 + m21) * invS;
        out[1] = 0.25 * s;
        out[2] = (m23 + m32) * invS;
    } else {
        s = 2 * mathf.sqrt(1 + m33 - m11 - m22);
        invS = 1 / s;

        out[3] = (m21 - m12) * invS;
        out[0] = (m13 + m31) * invS;
        out[1] = (m23 + m32) * invS;
        out[2] = 0.25 * s;
    }

    return out;
};

quat.fromMat3 = function(out, m) {
    return quat.fromMat(
        out,
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8]
    );
};

quat.fromMat4 = function(out, m) {
    return quat.fromMat(
        out,
        m[0], m[4], m[8],
        m[1], m[5], m[9],
        m[2], m[6], m[10]
    );
};


},
function(require, exports, module, global) {

var vec3 = require(36);


var aabb3 = exports;


function AABB3() {
    this.min = vec3.create(Infinity, Infinity, Infinity);
    this.max = vec3.create(-Infinity, -Infinity, -Infinity);
}


aabb3.create = function(min, max) {
    var out = new AABB3();

    if (min) {
        vec3.copy(out.min, min);
    }
    if (max) {
        vec3.copy(out.max, max);
    }

    return out;
};

aabb3.copy = function(out, a) {

    vec3.copy(out.min, a.min);
    vec3.copy(out.max, a.max);

    return out;
};

aabb3.clone = function(a) {
    return aabb3.create(a.min, a.max);
};

aabb3.set = function(out, min, max) {

    if (min) {
        vec3.copy(out.min, min);
    }
    if (max) {
        vec3.copy(out.max, max);
    }

    return out;
};

aabb3.expandPoint = function(out, point) {

    vec3.min(out.min, point);
    vec3.max(out.max, point);

    return out;
};

aabb3.expandVector = function(out, vector) {

    vec3.sub(out.min, vector);
    vec3.add(out.max, vector);

    return out;
};

aabb3.expandScalar = function(out, scalar) {

    vec3.ssub(out.min, scalar);
    vec3.sadd(out.max, scalar);

    return out;
};

aabb3.union = function(out, a, b) {

    vec3.min(out.min, a.min, b.min);
    vec3.max(out.max, a.max, b.max);

    return out;
};

aabb3.clear = function(out) {

    vec3.set(out.min, Infinity, Infinity, Infinity);
    vec3.set(out.max, -Infinity, -Infinity, -Infinity);

    return out;
};

aabb3.contains = function(out, point) {
    var min = out.min,
        max = out.max,
        px = point[0],
        py = point[1],
        pz = point[2];

    return !(
        px < min[0] || px > max[0] ||
        py < min[1] || py > max[1] ||
        pz < min[2] || pz > max[2]
    );
};

aabb3.intersects = function(a, b) {
    var aMin = a.min,
        aMax = a.max,
        bMin = b.min,
        bMax = b.max;

    return !(
        bMax[0] < aMin[0] || bMin[0] > aMax[0] ||
        bMax[1] < aMin[1] || bMin[1] > aMax[1] ||
        bMax[2] < aMin[2] || bMin[2] > aMax[2]
    );
};

aabb3.fromPoints = function(out, points) {
    var i = points.length,
        minx = Infinity,
        miny = Infinity,
        minz = Infinity,
        maxx = -Infinity,
        maxy = -Infinity,
        maxz = -Infinity,
        min = out.min,
        max = out.max,
        x, y, z, v;

    while (i--) {
        v = points[i];
        x = v[0];
        y = v[1];
        z = v[2];

        minx = minx > x ? x : minx;
        miny = miny > y ? y : miny;
        minz = minz > z ? z : minz;

        maxx = maxx < x ? x : maxx;
        maxy = maxy < y ? y : maxy;
        maxz = maxz < z ? z : maxz;
    }

    min[0] = minx;
    min[1] = miny;
    min[2] = minz;
    max[0] = maxx;
    max[1] = maxy;
    max[2] = maxz;

    return out;
};

aabb3.fromPointArray = function(out, points) {
    var i = 0,
        il = points.length,
        minx = Infinity,
        miny = Infinity,
        minz = Infinity,
        maxx = -Infinity,
        maxy = -Infinity,
        maxz = -Infinity,
        min = out.min,
        max = out.max,
        x, y, z;

    while (i < il) {
        x = points[i];
        y = points[i + 1];
        z = points[i + 2];
        i += 3;

        minx = minx > x ? x : minx;
        miny = miny > y ? y : miny;
        minz = minz > z ? z : minz;

        maxx = maxx < x ? x : maxx;
        maxy = maxy < y ? y : maxy;
        maxz = maxz < z ? z : maxz;
    }

    min[0] = minx;
    min[1] = miny;
    min[2] = minz;
    max[0] = maxx;
    max[1] = maxy;
    max[2] = maxz;

    return out;
};

aabb3.fromCenterSize = function(out, center, size) {
    var min = out.min,
        max = out.max,
        x = center[0],
        y = center[1],
        z = center[2],
        hx = size[0] * 0.5,
        hy = size[1] * 0.5,
        hz = size[2] * 0.5;

    min[0] = x - hx;
    min[1] = y - hy;
    min[2] = z - hz;

    max[0] = x + hx;
    max[1] = y + hy;
    max[2] = z + hz;

    return out;
};

aabb3.fromCenterRadius = function(out, center, radius) {
    var min = out.min,
        max = out.max,
        x = center[0],
        y = center[1],
        z = center[2];

    min[0] = x - radius;
    min[1] = y - radius;
    min[2] = z - radius;

    max[0] = x + radius;
    max[1] = y + radius;
    max[2] = z + radius;

    return out;
};

aabb3.equal = function(a, b) {
    return (
        vec3.equal(a.min, b.min) ||
        vec3.equal(a.max, b.max)
    );
};

aabb3.notEqual = function(a, b) {
    return (
        vec3.notEqual(a.min, b.min) ||
        vec3.notEqual(a.max, b.max)
    );
};

aabb3.str = function(out) {

    return "AABB3(" + vec3.str(out.min) + ", " + vec3.str(out.max) + ")";
};

aabb3.toJSON = function(out, json) {
    json = json || {};

    json.min = vec3.copy(json.min || [], out.min);
    json.max = vec3.copy(json.max || [], out.max);

    return json;
};

aabb3.fromJSON = function(out, json) {

    vec3.copy(out.min, json.min);
    vec3.copy(out.max, json.max);

    return json;
};


},
function(require, exports, module, global) {

var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array,
    AttributePrototype;


module.exports = Attribute;


function Attribute() {
    this.geometry = null;
    this.name = null;
    this.array = null;
    this.itemSize = null;
    this.dynamic = null;
}
AttributePrototype = Attribute.prototype;

Attribute.create = function(geometry, name, length, itemSize, ArrayType, dynamic, items) {
    return (new Attribute()).construct(geometry, name, length, itemSize, ArrayType, dynamic, items);
};

AttributePrototype.construct = function(geometry, name, length, itemSize, ArrayType, dynamic, items) {

    ArrayType = ArrayType || NativeFloat32Array;

    this.geometry = geometry;
    this.name = name;
    this.array = new ArrayType(length);
    this.itemSize = itemSize;
    this.dynamic = !!dynamic;

    if (items) {
        this.array.set(items);
    }

    return this;
};

AttributePrototype.destructor = function() {

    this.geometry = null;
    this.name = null;
    this.array = null;
    this.itemSize = null;
    this.dynamic = null;

    return this;
};

AttributePrototype.setDynamic = function(value) {
    if (this.dynamic === value) {
        return this;
    }

    this.dynamic = value;
    return this;
};

AttributePrototype.set = function(array) {

    this.array.set(array);
    return this;
};

AttributePrototype.setX = function(index, x) {

    this.array[index * this.itemSize] = x;
    return this;
};

AttributePrototype.setY = function(index, y) {

    this.array[index * this.itemSize + 1] = y;
    return this;
};

AttributePrototype.setZ = function(index, z) {

    this.array[index * this.itemSize + 2] = z;
    return this;
};

AttributePrototype.setXY = function(index, x, y) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;

    return this;
};

AttributePrototype.setXYZ = function(index, x, y, z) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;

    return this;
};

AttributePrototype.setXYZW = function(index, x, y, z, w) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;
    array[index + 3] = w;

    return this;
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    quat = require(147),
    mat4 = require(76);


var UNKNOWN_BONE_COUNT = 1,
    GeometryBonePrototype;


module.exports = GeometryBone;


function GeometryBone() {
    this.parentIndex = null;
    this.name = null;

    this.skinned = null;
    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = vec3.create(1, 1, 1);
    this.bindPose = mat4.create();
}
GeometryBonePrototype = GeometryBone.prototype;

GeometryBone.create = function(parentIndex, name) {
    return (new GeometryBone()).construct(parentIndex, name);
};

GeometryBonePrototype.construct = function(parentIndex, name) {

    this.parentIndex = parentIndex != null ? parentIndex : -1;
    this.name = name != null ? name : "GeometryBone" + UNKNOWN_BONE_COUNT++;
    this.skinned = false;

    return this;
};

GeometryBonePrototype.destructor = function() {

    this.parentIndex = null;
    this.name = null;

    this.skinned = null;
    vec3.set(this.position, 0, 0, 0);
    quat.set(this.rotation, 0, 0, 0, 1);
    vec3.set(this.scale, 1, 1, 1);
    mat4.identity(this.bindPose);

    return this;
};


},
function(require, exports, module, global) {

var isNumber = require(34),
    environment = require(1),
    eventListener = require(2),
    Class = require(9);


var ClassPrototype = Class.prototype,

    window = environment.window,
    document = environment.document,

    CanvasPrototype,
    addMeta, reScale, viewport, viewportWidth, viewportHeight, viewportScale, windowOnResize;


if (environment.browser) {
    addMeta = function(id, name, content) {
        var meta = document.createElement("meta"),
            head = document.head;

        meta.id = id;
        meta.name = name;
        meta.content = content;
        head.insertBefore(meta, head.firstChild);

        return meta;
    };

    reScale = /-scale\s *=\s*[.0-9]+/g;
    viewport = addMeta("viewport", "viewport", "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
    viewportWidth = addMeta("viewport-width", "viewport", "width=device-width");
    viewportHeight = addMeta("viewport-height", "viewport", "height=device-height");
    viewportScale = viewport.getAttribute("content");

    windowOnResize = function windowOnResize() {
        viewport.setAttribute("content", viewportScale.replace(reScale, "-scale=" + (1 / (window.devicePixelRatio || 1))));
        viewportWidth.setAttribute("content", "width=" + window.innerWidth);
        viewportHeight.setAttribute("content", "height=" + window.innerHeight);
        window.scrollTo(0, 1);
    };

    eventListener.on(window, "resize orientationchange", windowOnResize);
    windowOnResize();
}


module.exports = Canvas;


function Canvas() {
    Class.call(this);

    this.element = null;
    this.context = null;

    this.fixed = null;
    this.keepAspect = null;

    this.width = null;
    this.height = null;

    this.aspect = null;

    this.pixelWidth = null;
    this.pixelHeight = null;

    this.__handler = null;
}
Class.extend(Canvas, "odin.Canvas");
CanvasPrototype = Canvas.prototype;

CanvasPrototype.construct = function(options) {
    var element = document.createElement("canvas");

    ClassPrototype.construct.call(this);

    options = options || {};
    options.parent = (options.parent && options.parent.appendChild) ? options.parent : document.body;

    if (options.disableContextMenu === true) {
        element.oncontextmenu = function oncontextmenu() {
            return false;
        };
    }

    options.parent.appendChild(element);
    this.element = element;

    this.fixed = options.fixed != null ? options.fixed : (options.width == null && options.height == null) ? true : false;
    this.keepAspect = options.keepAspect != null ? !!options.keepAspect : false;

    this.width = isNumber(options.width) ? options.width : window.innerWidth;
    this.height = isNumber(options.height) ? options.height : window.innerHeight;

    this.aspect = isNumber(options.aspect) && options.width == null && options.height == null ? options.aspect : this.width / this.height;

    this.pixelWidth = this.width;
    this.pixelHeight = this.height;

    if (this.fixed) {
        Canvas_setFixed(this);
    }

    return this;
};

CanvasPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    if (this.fixed) {
        Canvas_removeFixed(this);
    }

    this.element = null;

    this.fixed = null;
    this.keepAspect = null;

    this.width = null;
    this.height = null;

    this.aspect = null;

    this.pixelWidth = null;
    this.pixelHeight = null;

    return this;
};

CanvasPrototype.setFixed = function(value) {
    if (value) {
        return Canvas_setFixed(this);
    } else {
        return Canvas_removeFixed(this);
    }
};

function Canvas_setFixed(_this) {
    var style = _this.element.style;

    style.position = "fixed";
    style.top = "50%";
    style.left = "50%";
    style.padding = "0px";
    style.marginLeft = "0px";
    style.marginTop = "0px";

    if (!_this.__handler) {
        _this.__handler = function handler() {
            Canvas_update(_this);
        };
    }

    eventListener.on(window, "resize orientationchange", _this.__handler);
    Canvas_update(_this);

    return _this;
}

function Canvas_removeFixed(_this) {
    var style = _this.element.style;

    style.position = "";
    style.top = "";
    style.left = "";
    style.padding = "";
    style.marginLeft = "";
    style.marginTop = "";

    if (_this.__handler) {
        eventListener.off(window, "resize orientationchange", _this.__handler);
    }

    return _this;
}

function Canvas_update(_this) {
    var w = window.innerWidth,
        h = window.innerHeight,
        aspect = w / h,
        element = _this.element,
        style = element.style,
        width, height;

    if (_this.keepAspect !== true) {
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

    _this.emit("resize", _this.pixelWidth, _this.pixelHeight);
}


},
function(require, exports, module, global) {

var indexOf = require(57),
    WebGLContext = require(31),
    mat4 = require(76),

    Class = require(9),
    side = require(89),

    MeshRenderer = require(153),
    SpriteRenderer = require(155),

    RendererGeometry = require(156),
    RendererMaterial = require(157);


var enums = WebGLContext.enums,
    ClassPrototype = Class.prototype,
    RendererPrototype;


module.exports = Renderer;


function Renderer() {
    var _this = this;

    Class.call(this);

    this.context = new WebGLContext();

    this.__rendererArray = [];
    this.renderers = {};

    this.__geometries = {};
    this.__materials = {};

    this.__programHash = {};
    this.__programs = [];

    this.onContextCreation = function() {
        _this.__onContextCreation();
    };
    this.onContextDestroy = function() {
        _this.__onContextDestroy();
    };
}
Class.extend(Renderer, "odin.Renderer");
RendererPrototype = Renderer.prototype;

RendererPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    this.addRenderer(MeshRenderer.create(this), false, false);
    this.addRenderer(SpriteRenderer.create(this), false, false);
    this.sortRenderers();

    return this;
};

RendererPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.context.clearGL();
    this.renderers = {};
    this.__rendererArray.length = 0;

    return this;
};

RendererPrototype.__onContextCreation = function() {
    var renderers = this.__rendererArray,
        i = -1,
        il = renderers.length - 1;

    while (i++ < il) {
        renderers[i].init();
    }

    return this;
};

RendererPrototype.__onContextDestroy = function() {
    var renderers = this.__rendererArray,
        i = -1,
        il = renderers.length - 1;

    while (i++ < il) {
        renderers[i].clear();
    }

    return this;
};

RendererPrototype.addRenderer = function(renderer, override, sort) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        index = rendererHash[renderer.componentName];

    if (index && !override) {
        throw new Error("Renderer.addRenderer(renderer, [, override]) pass override=true to override renderers");
    }
    renderers[renderers.length] = rendererHash[renderer.componentName] = renderer;

    if (sort !== false) {
        this.sortRenderers();
    }

    return this;
};

RendererPrototype.removeRenderer = function(componentName) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        renderer = rendererHash[componentName];

    if (renderer) {
        renderers.splice(indexOf(renderers, renderer), 1);
        delete rendererHash[componentName];
    }

    return this;
};

RendererPrototype.sortRenderers = function() {
    this.__rendererArray.sort(sortRenderers);
    return this;
};

function sortRenderers(a, b) {
    return a.order - b.order;
}

RendererPrototype.setCanvas = function(canvas, attributes) {
    var context = this.context;

    if (canvas && context.canvas !== canvas) {
        context.off("webglcontextcreation", this.onContextCreation);
        context.off("webglcontextrestored", this.onContextCreation);
        context.off("webglcontextcreationfailed", this.onContextDestroy);
        context.off("webglcontextlost", this.onContextDestroy);
    }

    context.on("webglcontextcreation", this.onContextCreation);
    context.on("webglcontextrestored", this.onContextCreation);
    context.on("webglcontextcreationfailed", this.onContextDestroy);
    context.on("webglcontextlost", this.onContextDestroy);

    context.setCanvas(canvas, attributes);

    return this;
};

RendererPrototype.geometry = function(geometry) {
    var geometries = this.__geometries;
    return geometries[geometry.__id] || (geometries[geometry.__id] = RendererGeometry.create(this.context, geometry));
};

RendererPrototype.material = function(material) {
    var materials = this.__materials;
    return materials[material.__id] || (materials[material.__id] = RendererMaterial.create(this, this.context, material));
};

RendererPrototype.bindMaterial = function(material) {
    this.setSide(material.side);
    this.context.setBlending(material.blending);
    if (material.wireframe) {
        this.context.setLineWidth(material.wireframeLineWidth);
    }
};

RendererPrototype.setSide = function(value) {
    switch (value) {
        case side.FRONT:
            this.context.setCullFace(enums.cullFace.BACK);
            break;
        case side.BACK:
            this.context.setCullFace(enums.cullFace.FRONT);
            break;
        case side.NONE:
            this.context.setCullFace(enums.cullFace.FRONT_AND_BACK);
            break;
        default:
            this.context.setCullFace(enums.cullFace.NONE);
            break;
    }
    return this;
};

var bindBoneUniforms_mat = mat4.create();
RendererPrototype.bindBoneUniforms = function(bones, glUniforms) {
    var boneMatrix = glUniforms.__hash.boneMatrix,
        boneMatrixValue, mat, i, il, index, bone;

    if (boneMatrix) {
        boneMatrixValue = boneMatrix.value;

        mat = bindBoneUniforms_mat;

        i = -1;
        il = bones.length - 1;
        index = 0;

        while (i++ < il) {
            bone = bones[i].components["odin.Bone"];
            mat4.mul(mat, bone.uniform, bone.bindPose);

            boneMatrixValue[index] = mat[0];
            boneMatrixValue[index + 1] = mat[1];
            boneMatrixValue[index + 2] = mat[2];
            boneMatrixValue[index + 3] = mat[3];
            boneMatrixValue[index + 4] = mat[4];
            boneMatrixValue[index + 5] = mat[5];
            boneMatrixValue[index + 6] = mat[6];
            boneMatrixValue[index + 7] = mat[7];
            boneMatrixValue[index + 8] = mat[8];
            boneMatrixValue[index + 9] = mat[9];
            boneMatrixValue[index + 10] = mat[10];
            boneMatrixValue[index + 11] = mat[11];
            boneMatrixValue[index + 12] = mat[12];
            boneMatrixValue[index + 13] = mat[13];
            boneMatrixValue[index + 14] = mat[14];
            boneMatrixValue[index + 15] = mat[15];

            index += 16;
        }

        boneMatrix.set(boneMatrixValue);
    }
};

RendererPrototype.bindUniforms = function(projection, modelView, normalMatrix, uniforms, glUniforms) {
    var glHash = glUniforms.__hash,
        glArray = glUniforms.__array,
        glUniform, uniform, i, il;

    if (glHash.modelViewMatrix) {
        glHash.modelViewMatrix.set(modelView);
    }
    if (glHash.perspectiveMatrix) {
        glHash.perspectiveMatrix.set(projection);
    }
    if (glHash.normalMatrix) {
        glHash.normalMatrix.set(normalMatrix);
    }

    i = -1;
    il = glArray.length - 1;

    while (i++ < il) {
        glUniform = glArray[i];

        if ((uniform = uniforms[glUniform.name])) {
            glUniform.set(uniform);
        }
    }

    return this;
};

RendererPrototype.bindAttributes = function(buffers, vertexBuffer, glAttributes) {
    var glArray = glAttributes.__array,
        i = -1,
        il = glArray.length - 1,
        glAttribute, buffer;

    while (i++ < il) {
        glAttribute = glArray[i];
        buffer = buffers[glAttribute.name];
        glAttribute.set(vertexBuffer, buffer.offset);
    }

    return this;
};

RendererPrototype.render = function(scene, camera) {
    var _this, context, renderers, renderer, managerHash, manager, i, il;

    _this = this;
    context = this.context;
    renderers = this.__rendererArray;
    managerHash = scene.managers;

    context.setViewport(0, 0, camera.width, camera.height);
    context.setClearColor(camera.background, 1);
    context.clearCanvas();

    i = -1;
    il = renderers.length - 1;

    while (i++ < il) {
        renderer = renderers[i];
        manager = managerHash[renderer.componentName];

        if (manager !== undefined && renderer.enabled) {
            renderer.beforeRender(camera, scene, manager);
            manager.forEach(renderer.bindRender(camera, scene, manager));
            renderer.afterRender(camera, scene, manager);
        }
    }

    return this;
};


},
function(require, exports, module, global) {

var mat3 = require(74),
    mat4 = require(76),
    ComponentRenderer = require(154);


var MeshRendererPrototype;


module.exports = MeshRenderer;


function MeshRenderer() {
    ComponentRenderer.call(this);
}
ComponentRenderer.extend(MeshRenderer, "odin.MeshRenderer", "odin.Mesh", 1);
MeshRendererPrototype = MeshRenderer.prototype;

var modelView = mat4.create(),
    normalMatrix = mat3.create();

MeshRendererPrototype.render = function(mesh, camera) {
    var renderer = this.renderer,
        context = renderer.context,
        gl = context.gl,

        components = mesh.entity.components,
        transform = components["odin.Transform"] || components["odin.Transform2D"],

        meshMaterial = mesh.material,
        meshGeometry = mesh.geometry,

        geometry = renderer.geometry(meshGeometry),
        program = renderer.material(meshMaterial).getProgramFor(meshGeometry),

        indexBuffer;

    transform.calculateModelView(camera.view, modelView);
    transform.calculateNormalMatrix(modelView, normalMatrix);

    context.setProgram(program);

    renderer.bindMaterial(meshMaterial);
    renderer.bindUniforms(camera.projection, modelView, normalMatrix, meshMaterial.uniforms, program.uniforms);
    renderer.bindBoneUniforms(mesh.bones, program.uniforms);
    renderer.bindAttributes(geometry.buffers.__hash, geometry.getVertexBuffer(), program.attributes);

    if (meshMaterial.wireframe !== true) {
        indexBuffer = geometry.getIndexBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    } else {
        indexBuffer = geometry.getLineBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.LINES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }

    return this;
};


},
function(require, exports, module, global) {

var Class = require(9);


var ComponentRendererPrototype;


module.exports = ComponentRenderer;


function renderEach(component) {
    return renderEach.render(
        component,
        renderEach.camera,
        renderEach.scene,
        renderEach.manager
    );
}

renderEach.set = function(render, camera, scene, manager) {
    renderEach.render = render;
    renderEach.camera = camera;
    renderEach.scene = scene;
    renderEach.manager = manager;
    return renderEach;
};


function ComponentRenderer() {
    var _this = this;

    Class.call(this);

    this.renderer = null;
    this.enabled = true;

    this.__render = function(component, camera, scene, manager) {
        _this.render(component, camera, scene, manager);
    };
}

ComponentRenderer.onExtend = function(child, className, componentName, order) {
    child.componentName = child.prototype.componentName = componentName;
    child.order = child.prototype.order = order || 0;
};

Class.extend(ComponentRenderer, "odin.ComponentRenderer");
ComponentRendererPrototype = ComponentRenderer.prototype;

ComponentRenderer.order = ComponentRendererPrototype.order = 0;

ComponentRendererPrototype.construct = function(renderer) {
    this.renderer = renderer;
    return this;
};

ComponentRendererPrototype.destructor = function() {
    this.renderer = null;
    return this;
};

ComponentRendererPrototype.bindRender = function(camera, scene, manager) {
    return renderEach.set(this.__render, camera, scene, manager);
};

ComponentRendererPrototype.enable = function() {
    this.enabled = true;
    return this;
};

ComponentRendererPrototype.disable = function() {
    this.enabled = false;
    return this;
};

ComponentRendererPrototype.init = function() {};

ComponentRendererPrototype.clear = function() {};

ComponentRendererPrototype.beforeRender = function( /* camera, scene, manager */ ) {};

ComponentRendererPrototype.afterRender = function( /* camera, scene, manager */ ) {};

ComponentRendererPrototype.render = function( /* component, camera, scene, manager */ ) {};


},
function(require, exports, module, global) {

var mat3 = require(74),
    mat4 = require(76),
    vec2 = require(64),
    vec4 = require(67),
    WebGLContext = require(31),
    Geometry = require(146),
    ComponentRenderer = require(154);


var depth = WebGLContext.enums.depth,

    NativeUint16Array = typeof(Uint16Array) !== "undefined" ? Uint16Array : Array,
    NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array,

    SpriteRendererPrototype;


module.exports = SpriteRenderer;


function SpriteRenderer() {
    var geometry = Geometry.create(),
        uv = [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ];

    ComponentRenderer.call(this);

    geometry
        .addAttribute("position", 12, 3, NativeFloat32Array, false, [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0,
            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0
        ])
        .addAttribute("normal", 12, 3, NativeFloat32Array, false, [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ])
        .addAttribute("tangent", 16, 4, NativeFloat32Array, false, [
            0.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0
        ])
        .addAttribute("uv", 8, 2, NativeFloat32Array, false, uv)
        .addAttribute("uv2", 8, 2, NativeFloat32Array, false, uv);

    geometry.index = new NativeUint16Array([
        0, 1, 2, 3, 2, 1
    ]);

    this.geometry = geometry;
    this.spriteGeometry = null;

    this.__previous = null;
}
ComponentRenderer.extend(SpriteRenderer, "odin.SpriteRenderer", "odin.Sprite", 0);
SpriteRendererPrototype = SpriteRenderer.prototype;

SpriteRendererPrototype.init = function() {
    this.spriteGeometry = this.renderer.geometry(this.geometry);
};

SpriteRendererPrototype.beforeRender = function() {
    var context = this.renderer.context;

    this.__previous = context.__depthFunc;
    context.setDepthFunc(depth.None);
};

SpriteRendererPrototype.afterRender = function() {
    this.renderer.context.setDepthFunc(this.__previous);
};

var size = vec2.create(1, 1),
    clipping = vec4.create(0, 0, 1, 1),
    modelView = mat4.create(),
    normalMatrix = mat3.create();

SpriteRendererPrototype.render = function(sprite, camera) {
    var renderer = this.renderer,
        context = renderer.context,
        gl = context.gl,

        components = sprite.entity.components,
        transform = components["odin.Transform"] || components["odin.Transform2D"],

        spriteMaterial = sprite.material,
        spriteGeometry = this.geometry,

        geometry = renderer.geometry(spriteGeometry),
        program = renderer.material(spriteMaterial).getProgramFor(sprite),

        glUniforms = program.uniforms,
        glUniformHash = glUniforms.__hash,

        indexBuffer;

    transform.calculateModelView(camera.view, modelView);
    transform.calculateNormalMatrix(modelView, normalMatrix);

    context.setProgram(program);

    vec2.set(size, sprite.width, sprite.height);
    glUniformHash.size.set(size);

    if (glUniformHash.clipping) {
        vec4.set(clipping, sprite.x, sprite.y, sprite.w, sprite.h);
        glUniformHash.clipping.set(clipping);
    }

    renderer.bindMaterial(spriteMaterial);
    renderer.bindUniforms(camera.projection, modelView, normalMatrix, spriteMaterial.uniforms, glUniforms);
    renderer.bindAttributes(geometry.buffers.__hash, geometry.getVertexBuffer(), program.attributes);

    if (spriteMaterial.wireframe !== true) {
        indexBuffer = geometry.getIndexBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    } else {
        indexBuffer = geometry.getLineBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.LINES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }

    return this;
};


},
function(require, exports, module, global) {

var FastHash = require(56);


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array,
    NativeUint16Array = typeof(Uint16Array) !== "undefined" ? Uint16Array : Array,
    RendererGeometryPrototype;


module.exports = RendererGeometry;


function RendererGeometry() {

    this.context = null;
    this.geometry = null;

    this.buffers = new FastHash("name");

    this.glVertexBuffer = null;
    this.glIndexBuffer = null;
    this.glIndexLineBuffer = null;

    this.needsVertexCompile = null;
    this.needsIndexCompile = null;
    this.needsLineCompile = null;
}
RendererGeometryPrototype = RendererGeometry.prototype;

RendererGeometry.create = function(context, geometry) {
    return (new RendererGeometry()).construct(context, geometry);
};

RendererGeometryPrototype.construct = function(context, geometry) {

    this.context = context;
    this.geometry = geometry;

    this.needsVertexCompile = true;
    this.needsIndexCompile = true;
    this.needsLineCompile = true;

    return this;
};

RendererGeometryPrototype.destructor = function() {

    this.context = null;
    this.geometry = null;

    this.buffers.clear();

    this.glVertexBuffer = null;
    this.glIndexBuffer = null;
    this.glIndexLineBuffer = null;

    this.needsVertexCompile = false;
    this.needsIndexCompile = false;
    this.needsLineCompile = false;

    return this;
};

RendererGeometryPrototype.getVertexBuffer = function() {
    var glVertexBuffer = this.glVertexBuffer;

    if (glVertexBuffer) {
        if (this.needsVertexCompile === false) {
            return glVertexBuffer;
        } else {
            glVertexBuffer.needsCompile = true;
            return RendererGeometry_compileVertexBuffer(this);
        }
    } else {
        return RendererGeometry_compileVertexBuffer(this);
    }
};

RendererGeometryPrototype.getLineBuffer = function() {
    var glIndexLineBuffer = this.glIndexLineBuffer;

    if (glIndexLineBuffer) {
        if (this.needsLineCompile === false) {
            return glIndexLineBuffer;
        } else {
            glIndexLineBuffer.needsCompile = true;
            return RendererGeometry_compileLineIndexBuffer(this);
        }
    } else {
        return RendererGeometry_compileLineIndexBuffer(this);
    }
};

RendererGeometryPrototype.getIndexBuffer = function() {
    var glIndexBuffer = this.glIndexBuffer;

    if (glIndexBuffer) {
        if (this.needsIndexCompile === false) {
            return glIndexBuffer;
        } else {
            glIndexBuffer.needsCompile = true;
            return RendererGeometry_compileIndexBuffer(this);
        }
    } else {
        return RendererGeometry_compileIndexBuffer(this);
    }
};

function RendererGeometry_compileLineIndexBuffer(_this) {
    var context = _this.context,
        gl = context.gl,

        geometry = _this.geometry,
        indexArray = geometry.index,

        length = indexArray.length,
        i = 0,

        lineBuffer = new NativeUint16Array(length * 2),
        glIndexLineBuffer = _this.glIndexLineBuffer || (_this.glIndexLineBuffer = context.createBuffer()),

        triangleIndex = 0,
        index = 0;

    while (i < length) {
        lineBuffer[index] = indexArray[triangleIndex];
        lineBuffer[index + 1] = indexArray[triangleIndex + 1];

        lineBuffer[index + 2] = indexArray[triangleIndex + 1];
        lineBuffer[index + 3] = indexArray[triangleIndex + 2];

        lineBuffer[index + 4] = indexArray[triangleIndex + 2];
        lineBuffer[index + 5] = indexArray[triangleIndex];

        triangleIndex += 3;
        index += 6;
        i += 3;
    }

    _this.needsLineCompile = false;

    return glIndexLineBuffer.compile(gl.ELEMENT_ARRAY_BUFFER, lineBuffer, 0, gl.STATIC_DRAW);
}

function RendererGeometry_compileIndexBuffer(_this) {
    var context = _this.context,
        gl = context.gl,
        glIndexBuffer = _this.glIndexBuffer || (_this.glIndexBuffer = context.createBuffer());

    glIndexBuffer.compile(gl.ELEMENT_ARRAY_BUFFER, _this.geometry.index, 0, gl.STATIC_DRAW);
    _this.needsIndexCompile = false;

    return glIndexBuffer;
}

function RendererGeometry_compileVertexBuffer(_this) {
    var context = _this.context,
        gl = context.gl,

        geometry = _this.geometry,
        attributes = geometry.attributes.__array,

        glVertexBuffer = _this.glVertexBuffer || (_this.glVertexBuffer = context.createBuffer()),
        buffers = _this.buffers,

        vertexLength = 0,
        stride = 0,
        last = 0,
        offset = 0,

        i = -1,
        il = attributes.length - 1,

        vertexArray, attribute, attributeArray, itemSize, index, j, jl, k, kl;

    buffers.clear();

    while (i++ < il) {
        attribute = attributes[i];
        vertexLength += attribute.array.length;
        stride += attribute.itemSize;
    }

    vertexArray = new NativeFloat32Array(vertexLength);

    i = -1;
    while (i++ < il) {
        attribute = attributes[i];
        attributeArray = attribute.array;

        j = 0;
        jl = vertexLength;

        itemSize = attribute.itemSize;
        index = 0;

        offset += last;
        last = itemSize;

        while (j < jl) {
            k = -1;
            kl = itemSize - 1;

            while (k++ < kl) {
                vertexArray[offset + j + k] = attributeArray[index + k];
            }

            j += stride;
            index += itemSize;
        }

        buffers.add(new DataBuffer(attribute.name, offset * 4));
    }

    glVertexBuffer.compile(gl.ARRAY_BUFFER, vertexArray, stride * 4, gl.STATIC_DRAW);
    _this.needsVertexCompile = false;

    return glVertexBuffer;
}

function DataBuffer(name, offset) {
    this.name = name;
    this.offset = offset;
}


},
function(require, exports, module, global) {

var has = require(10);


var RendererMaterialPrototype;


module.exports = RendererMaterial;


function RendererMaterial() {

    this.renderer = null;
    this.context = null;
    this.material = null;

    this.programs = {};

    this.needsCompile = null;
}
RendererMaterialPrototype = RendererMaterial.prototype;

RendererMaterial.create = function(renderer, context, material) {
    return (new RendererMaterial()).construct(renderer, context, material);
};

RendererMaterialPrototype.construct = function(renderer, context, material) {

    this.renderer = renderer;
    this.context = context;
    this.material = material;

    return this;
};

RendererMaterialPrototype.destructor = function() {
    var programs = this.programs,
        id;

    this.renderer = null;
    this.context = null;
    this.material = null;

    for (id in programs) {
        if (has(programs, id)) {
            delete programs[id];
        }
    }

    this.programs = null;

    return this;
};

RendererMaterialPrototype.getProgramFor = function(data) {
    var programData = this.renderer.__programHash[data.__id],
        program;

    if (programData) {
        program = programData.program;

        if (program.needsCompile === false) {
            return program;
        } else {
            return RendererMaterial_compile(this, data);
        }
    } else {
        return RendererMaterial_compile(this, data);
    }
};

function ProgramData() {
    var _this = this;

    this.used = 1;
    this.program = null;
    this.vertex = null;
    this.fragment = null;

    this.onUpdate = function() {
        _this.program.needsUpdate = true;
    };
}

function RendererMaterial_compile(_this, data) {
    var id = data.__id,

        renderer = _this.renderer,

        programs = renderer.__programs,
        programHash = renderer.__programHash,

        programData = programHash[id],

        i = -1,
        il = programs.length - 1,
        program, shader, options, vertex, fragment;

    if (programData) {
        if (_this.programs[id] !== programData) {
            _this.programs[id] = programData;
            programData.used += 1;
            data.on("update", programData.onUpdate);
        }
        program = programData.program;
    } else {
        shader = _this.material.shader;
        options = getOptions(data);

        vertex = shader.vertex(options);
        fragment = shader.fragment(options);

        while (i++ < il) {
            program = programs[i];

            if (program.vertex === vertex && program.fragment === fragment) {
                programData = program;
                break;
            }
        }

        if (!programData) {
            programData = new ProgramData();
            program = programData.program = _this.context.createProgram();
        } else {
            programData.used += 1;
            program = programData.program;
        }

        programData.vertex = vertex;
        programData.fragment = fragment;

        program.compile(vertex, fragment);

        _this.programs[id] = programHash[id] = programs[programs.length] = programData;
        data.on("update", programData.onUpdate);
    }

    return program;
}

function getOptions(data) {
    var options = {},
        material;

    options.boneCount = data.bones ? data.bones.length : 0;
    options.boneWeightCount = data.boneWeightCount || 0;
    options.useBones = options.boneCount !== 0;
    options.isSprite = data.x != null && data.y != null && data.width != null && data.height != null;

    if (data.material) {
        material = data.material;

        options.receiveShadow = material.receiveShadow;
        options.castShadow = material.castShadow;
        options.side = material.side;
        options.wireframe = material.wireframe;
    }

    return options;
}


},
function(require, exports, module, global) {

var Class = require(9);


var PluginPrototype;


module.exports = Plugin;


function Plugin() {

    Class.call(this);

    this.scene = null;
}
Class.extend(Plugin, "odin.Plugin");
PluginPrototype = Plugin.prototype;

PluginPrototype.init = function init() {
    this.emit("init");
    return this;
};

PluginPrototype.awake = function awake() {
    this.emit("awake");
    return this;
};

PluginPrototype.clear = function clear(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

PluginPrototype.update = function update() {
    return this;
};

PluginPrototype.destroy = function(emitEvent) {
    var scene = this.scene;

    if (scene) {
        if (emitEvent !== false) {
            this.clear(emitEvent);
            this.emit("destroy");
        }
        scene.removePlugin(this);
    }

    return this;
};


},
function(require, exports, module, global) {

var indexOf = require(57),
    Class = require(9);


var ClassPrototype = Class.prototype,
    ComponentManagerPrototype;


module.exports = ComponentManager;


function ComponentManager() {

    Class.call(this);

    this.scene = null;
    this.__components = [];
}

ComponentManager.onExtend = function(child, className, order) {
    child.order = child.prototype.order = order != null ? order : 0;
};

Class.extend(ComponentManager, "odin.ComponentManager");
ComponentManagerPrototype = ComponentManager.prototype;

ComponentManager.order = ComponentManagerPrototype.order = 0;

ComponentManagerPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

ComponentManagerPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.scene = null;
    this.__components.length = 0;

    return this;
};

ComponentManagerPrototype.onAddToScene = function() {
    return this;
};

ComponentManagerPrototype.onRemoveFromScene = function() {
    return this;
};

ComponentManagerPrototype.isEmpty = function() {

    return this.__components.length === 0;
};

ComponentManagerPrototype.sort = function() {
    this.__components.sort(this.sortFunction);
    return this;
};

ComponentManagerPrototype.sortFunction = function() {
    return 0;
};

ComponentManagerPrototype.init = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].init();
    }

    return this;
};

ComponentManagerPrototype.awake = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].awake();
    }

    return this;
};

ComponentManagerPrototype.update = function() {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        components[i].update();
    }

    return this;
};

ComponentManagerPrototype.clear = function(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ComponentManagerPrototype.forEach = function(callback) {
    var components = this.__components,
        i = -1,
        il = components.length - 1;

    while (i++ < il) {
        if (callback(components[i], i) === false) {
            return false;
        }
    }

    return true;
};

ComponentManagerPrototype.has = function(component) {
    return indexOf(this.__components, component) !== -1;
};

ComponentManagerPrototype.addComponent = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index === -1) {
        components[components.length] = component;
    }

    return this;
};

ComponentManagerPrototype.removeComponent = function(component) {
    var components = this.__components,
        index = indexOf(components, component);

    if (index !== -1) {
        components.splice(index, 1);
    }

    return this;
};


},
function(require, exports, module, global) {

var Class = require(9),
    ComponentManager = require(159);


var ClassPrototype = Class.prototype,
    ComponentPrototype;


module.exports = Component;


function Component() {

    Class.call(this);

    this.manager = null;
    this.entity = null;
}

Component.onExtend = function(child, className, manager) {
    manager = manager || ComponentManager;

    child.Manager = child.prototype.Manager = manager;
    manager.prototype.componentName = child.className;
};

Class.extend(Component, "odin.Component");
ComponentPrototype = Component.prototype;

Component.className = ComponentPrototype.className = "odin.Component";
Component.Manager = ComponentPrototype.Manager = ComponentManager;

ComponentPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

ComponentPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.manager = null;
    this.entity = null;

    return this;
};

ComponentPrototype.init = function() {
    this.emit("init");
    return this;
};

ComponentPrototype.awake = function() {
    this.emit("awake");
    return this;
};

ComponentPrototype.clear = function(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ComponentPrototype.update = function() {
    return this;
};

ComponentPrototype.destroy = function(emitEvent) {
    var entity = this.entity;

    if (entity) {
        if (emitEvent !== false) {
            this.emit("destroy");
        }
        entity.removeComponent(this);

        return this;
    } else {
        return this;
    }
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    quat = require(147),
    mat3 = require(74),
    mat4 = require(76),
    Component = require(160),
    TransformManager = require(162);


var ComponentPrototype = Component.prototype,
    TransformPrototype;


module.exports = Transform;


function Transform() {

    Component.call(this);

    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = vec3.create(1.0, 1.0, 1.0);

    this.matrix = mat4.create();
    this.matrixWorld = mat4.create();
}
Component.extend(Transform, "odin.Transform", TransformManager);
TransformPrototype = Transform.prototype;

TransformPrototype.construct = function() {

    ComponentPrototype.construct.call(this);

    return this;
};

TransformPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    vec3.set(this.position, 0.0, 0.0, 0.0);
    quat.set(this.rotation, 0.0, 0.0, 0.0, 1.0);
    vec3.set(this.scale, 1.0, 1.0, 1.0);

    mat4.identity(this.matrix);
    mat4.identity(this.matrixWorld);

    return this;
};

TransformPrototype.init = function() {

    ComponentPrototype.init.call(this);

    return this;
};

TransformPrototype.setPosition = function(v) {
    vec3.copy(this.position, v);
    return this;
};

TransformPrototype.setRotation = function(v) {
    quat.copy(this.rotation, v);
    return this;
};

TransformPrototype.setScale = function(v) {
    vec3.copy(this.scale, v);
    return this;
};

var translate_vec3 = vec3.create();
TransformPrototype.translate = function(translation, relativeTo) {
    var thisPosition = this.position,
        v = vec3.copy(translate_vec3, translation);

    if (relativeTo && relativeTo.position) {
        vec3.transformQuat(v, v, relativeTo.position);
    } else if (relativeTo) {
        vec3.transformQuat(v, v, relativeTo);
    }

    vec3.add(thisPosition, thisPosition, v);

    return this;
};

var rotate_vec3 = vec3.create();
TransformPrototype.rotate = function(rotation, relativeTo) {
    var thisRotation = this.rotation,
        v = vec3.copy(rotate_vec3, rotation);

    if (relativeTo && relativeTo.rotation) {
        vec3.transformQuat(v, v, relativeTo.rotation);
    } else if (relativeTo) {
        vec3.transformQuat(v, v, relativeTo);
    }

    quat.rotate(thisRotation, thisRotation, v[0], v[1], v[2]);

    return this;
};

var lookAt_mat = mat4.create(),
    lookAt_vec = vec3.create(),
    lookAt_dup = vec3.create(0.0, 0.0, 1.0);
TransformPrototype.lookAt = function(target, up) {
    var mat = lookAt_mat,
        vec = lookAt_vec;

    up = up || lookAt_dup;

    if (target.matrixWorld) {
        vec3.transformMat4(vec, vec3.set(vec, 0.0, 0.0, 0.0), target.matrixWorld);
    } else {
        vec3.copy(vec, target);
    }

    mat4.lookAt(mat, this.position, vec, up);
    quat.fromMat4(this.rotation, mat);

    return this;
};

TransformPrototype.localToWorld = function(out, v) {
    return vec3.transformMat4(out, v, this.matrixWorld);
};

var worldToLocal_mat = mat4.create();
TransformPrototype.worldToLocal = function(out, v) {
    return vec3.transformMat4(out, v, mat4.inverse(worldToLocal_mat, this.matrixWorld));
};

TransformPrototype.update = function() {
    var matrix = this.matrix,
        entity = this.entity,
        parent = entity && entity.parent,
        parentTransform = parent && parent.components["odin.Transform"];

    mat4.compose(matrix, this.position, this.scale, this.rotation);

    if (parentTransform) {
        mat4.mul(this.matrixWorld, parentTransform.matrixWorld, matrix);
    } else {
        mat4.copy(this.matrixWorld, matrix);
    }

    return this;
};

TransformPrototype.getMatrixWorld = function() {
    return this.matrixWorld;
};

TransformPrototype.calculateModelView = function(viewMatrix, modelView) {
    return mat4.mul(modelView, viewMatrix, this.matrixWorld);
};

TransformPrototype.calculateNormalMatrix = function(modelView, normalMatrix) {
    return mat3.transpose(normalMatrix, mat3.inverseMat4(normalMatrix, modelView));
};

TransformPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.position = vec3.copy(json.position || [], this.position);
    json.rotation = quat.copy(json.rotation || [], this.rotation);
    json.scale = vec3.copy(json.scale || [], this.scale);

    return json;
};

TransformPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    vec3.copy(this.position, json.position);
    quat.copy(this.rotation, json.rotation);
    vec3.copy(this.scale, json.scale);

    return this;
};


},
function(require, exports, module, global) {

var ComponentManager = require(159);


var TransformManagerPrototype;


module.exports = TransformManager;


function TransformManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(TransformManager, "odin.TransformManager", 9999);
TransformManagerPrototype = TransformManager.prototype;

TransformManagerPrototype.sortFunction = function(a, b) {
    return a.entity.depth - b.entity.depth;
};


},
function(require, exports, module, global) {

var vec2 = require(64),
    mat3 = require(74),
    mat32 = require(164),
    mat4 = require(76),
    Component = require(160),
    Transform2DManager = require(165);


var ComponentPrototype = Component.prototype,
    Transform2DPrototype;


module.exports = Transform2D;


function Transform2D() {

    Component.call(this);

    this.position = vec2.create();
    this.rotation = 0.0;
    this.scale = vec2.create(1.0, 1.0);

    this.matrix = mat32.create();
    this.matrixWorld = mat32.create();
}
Component.extend(Transform2D, "odin.Transform2D", Transform2DManager);
Transform2DPrototype = Transform2D.prototype;

Transform2DPrototype.construct = function() {

    ComponentPrototype.construct.call(this);

    return this;
};

Transform2DPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    vec2.set(this.position, 0.0, 0.0);
    this.rotation = 0.0;
    vec2.set(this.scale, 1.0, 1.0);

    mat32.identity(this.matrix);
    mat32.identity(this.matrixWorld);

    return this;
};

Transform2DPrototype.init = function() {

    ComponentPrototype.init.call(this);

    return this;
};

Transform2DPrototype.setPosition = function(v) {
    vec2.copy(this.position, v);
    return this;
};

Transform2DPrototype.setRotation = function(value) {
    this.rotation = value;
    return this;
};

Transform2DPrototype.setScale = function(v) {
    vec2.copy(this.scale, v);
    return this;
};

var translate_vec2 = vec2.create();
Transform2DPrototype.translate = function(translation, relativeTo) {
    var thisPosition = this.position,
        v = vec2.copy(translate_vec2, translation);

    if (relativeTo && relativeTo.position) {
        vec2.transformQuat(v, v, relativeTo.position);
    } else if (relativeTo) {
        vec2.transformQuat(v, v, relativeTo);
    }

    vec2.add(thisPosition, thisPosition, v);

    return this;
};

Transform2DPrototype.rotate = function(rotation) {
    this.rotation = rotation;
    return this;
};

var lookAt_mat = mat32.create(),
    lookAt_vec = vec2.create();
Transform2DPrototype.lookAt = function(target) {
    var mat = lookAt_mat,
        vec = lookAt_vec;

    if (target.matrixWorld) {
        vec2.transformMat4(vec, vec2.set(vec, 0.0, 0.0), target.matrixWorld);
    } else {
        vec2.copy(vec, target);
    }

    mat32.lookAt(mat, this.position, vec);
    this.rotation = mat32.getRotation(mat);

    return this;
};

Transform2DPrototype.localToWorld = function(out, v) {
    return vec2.transformMat32(out, v, this.matrixWorld);
};

var worldToLocal_mat = mat32.create();
Transform2DPrototype.worldToLocal = function(out, v) {
    return vec2.transformMat32(out, v, mat32.inverse(worldToLocal_mat, this.matrixWorld));
};

Transform2DPrototype.update = function() {
    var matrix = this.matrix,
        entity = this.entity,
        parent = entity && entity.parent,
        parentTransform2D = parent && parent.components["odin.Transform2D"];

    mat32.compose(matrix, this.position, this.scale, this.rotation);

    if (parentTransform2D) {
        mat32.mul(this.matrixWorld, parentTransform2D.matrixWorld, matrix);
    } else {
        mat32.copy(this.matrixWorld, matrix);
    }

    return this;
};

var getMatrixWorld_mat4 = mat4.create();
Transform2DPrototype.getMatrixWorld = function() {
    var tmp = getMatrixWorld_mat4,
        mw = this.matrixWorld;

    tmp[0] = mw[0];
    tmp[4] = mw[2];
    tmp[1] = mw[1];
    tmp[5] = mw[3];
    tmp[12] = mw[4];
    tmp[13] = mw[5];

    return tmp;
};

Transform2DPrototype.calculateModelView = function(viewMatrix, modelView) {
    return mat4.mul(modelView, viewMatrix, this.getMatrixWorld());
};

Transform2DPrototype.calculateNormalMatrix = function(modelView, normalMatrix) {
    return mat3.transpose(normalMatrix, mat3.inverseMat4(normalMatrix, modelView));
};

Transform2DPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.position = vec2.copy(json.position || [], this.position);
    json.rotation = json.rotation;
    json.scale = vec2.copy(json.scale || [], this.scale);

    return json;
};

Transform2DPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    vec2.copy(this.position, json.position);
    this.rotation = json.rotation;
    vec2.copy(this.scale, json.scale);

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32),
    vec2 = require(64);


var mat32 = exports;


mat32.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : mathf.ArrayType;


mat32.create = function(m11, m12, m13, m21, m22, m23) {
    var out = new mat32.ArrayType(6);

    out[0] = m11 !== undefined ? m11 : 1;
    out[2] = m12 !== undefined ? m12 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[3] = m22 !== undefined ? m22 : 1;
    out[4] = m13 !== undefined ? m13 : 0;
    out[5] = m23 !== undefined ? m23 : 0;

    return out;
};

mat32.copy = function(out, a) {

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];

    return out;
};

mat32.clone = function(a) {
    var out = new mat32.ArrayType(6);

    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];

    return out;
};

mat32.set = function(out, m11, m12, m13, m21, m22, m23) {

    out[0] = m11 !== undefined ? m11 : 1;
    out[2] = m12 !== undefined ? m12 : 0;
    out[1] = m21 !== undefined ? m21 : 0;
    out[3] = m22 !== undefined ? m22 : 1;
    out[4] = m13 !== undefined ? m13 : 0;
    out[5] = m23 !== undefined ? m23 : 0;

    return out;
};

mat32.identity = function(out) {

    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;

    return out;
};

mat32.zero = function(out) {

    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;

    return out;
};

mat32.mul = function(out, a, b) {
    var a11 = a[0],
        a12 = a[2],
        a13 = a[4],
        a21 = a[1],
        a22 = a[3],
        a23 = a[5],

        b11 = b[0],
        b12 = b[2],
        b13 = b[4],
        b21 = b[1],
        b22 = b[3],
        b23 = b[5];

    out[0] = a11 * b11 + a21 * b12;
    out[2] = a12 * b11 + a22 * b12;

    out[1] = a11 * b21 + a21 * b22;
    out[3] = a12 * b21 + a22 * b22;

    out[4] = a11 * b13 + a12 * b23 + a13;
    out[5] = a21 * b13 + a22 * b23 + a23;

    return out;
};

mat32.smul = function(out, a, s) {

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;

    return out;
};

mat32.sdiv = function(out, a, s) {
    s = s !== 0 ? 1 / s : s;

    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;

    return out;
};

mat32.determinant = function(a) {

    return a[0] * a[3] - a[2] * a[1];
};

mat32.inverse = function(out, a) {
    var m11 = a[0],
        m12 = a[2],
        m13 = a[4],
        m21 = a[1],
        m22 = a[3],
        m23 = a[5],

        det = m11 * m22 - m12 * m21;

    if (det === 0) {
        return mat32.identity(out);
    }
    det = 1 / det;

    out[0] = m22 * det;
    out[1] = -m12 * det;
    out[2] = -m21 * det;
    out[3] = m11 * det;

    out[4] = (m21 * m23 - m22 * m13) * det;
    out[5] = -(m11 * m23 - m12 * m13) * det;

    return out;
};

mat32.transpose = function(out, a) {
    var tmp;

    if (out === a) {
        tmp = a[1];
        out[1] = a[2];
        out[2] = tmp;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }

    return out;
};

mat32.lookAt = function(out, eye, target) {
    var x = target[0] - eye[0],
        y = target[1] - eye[1],
        a = mathf.atan2(y, x) - mathf.HALF_PI,
        c = mathf.cos(a),
        s = mathf.sin(a);

    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;

    return out;
};

mat32.compose = function(out, position, scale, angle) {
    var sx = scale[0],
        sy = scale[1],
        c = mathf.cos(angle),
        s = mathf.sin(angle);

    out[0] = c * sx;
    out[1] = s * sx;
    out[2] = -s * sy;
    out[3] = c * sy;

    out[4] = position[0];
    out[5] = position[1];

    return out;
};

mat32.decompose = function(out, position, scale) {
    var m11 = out[0],
        m12 = out[1],
        sx = vec2.lengthValues(m11, m12),
        sy = vec2.lengthValues(out[2], out[3]);

    position[0] = out[4];
    position[1] = out[5];

    scale[0] = sx;
    scale[1] = sy;

    return mathf.atan2(m12, m11);
};

mat32.setRotation = function(out, angle) {
    var c = mathf.cos(angle),
        s = mathf.sin(angle);

    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;

    return out;
};

mat32.getRotation = function(out) {

    return mathf.atan2(out[1], out[0]);
};

mat32.setPosition = function(out, v) {

    out[4] = v[0];
    out[5] = v[1];

    return out;
};

mat32.getPosition = function(out, v) {

    v[0] = out[4];
    v[1] = out[5];

    return out;
};

mat32.extractPosition = function(out, a) {

    out[4] = a[4];
    out[5] = a[5];

    return out;
};

mat32.extractRotation = function(out, a) {
    var m11 = a[0],
        m12 = a[2],
        m21 = a[1],
        m22 = a[3],

        x = m11 * m11 + m21 * m21,
        y = m12 * m12 + m22 * m22,

        sx = x !== 0 ? 1 / mathf.sqrt(x) : 0,
        sy = y !== 0 ? 1 / mathf.sqrt(y) : 0;

    out[0] = m11 * sx;
    out[1] = m21 * sx;

    out[2] = m12 * sy;
    out[3] = m22 * sy;

    return out;
};

mat32.translate = function(out, a, v) {
    var x = v[0],
        y = v[1];

    out[4] = a[0] * x + a[2] * y + a[4];
    out[5] = a[1] * x + a[3] * y + a[5];

    return out;
};

mat32.rotate = function(out, a, angle) {
    var m11 = a[0],
        m12 = a[2],
        m21 = a[1],
        m22 = a[3],

        s = mathf.sin(angle),
        c = mathf.cos(angle);

    out[0] = m11 * c + m12 * s;
    out[1] = m11 * -s + m12 * c;
    out[2] = m21 * c + m22 * s;
    out[3] = m21 * -s + m22 * c;

    return out;
};

mat32.scale = function(out, a, v) {
    var x = v[0],
        y = v[1];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[4] = a[4] * x;

    out[2] = a[2] * y;
    out[3] = a[3] * y;
    out[5] = a[5] * y;

    return out;
};

mat32.orthographic = function(out, left, right, top, bottom) {
    var w = right - left,
        h = top - bottom,

        x = (right + left) / w,
        y = (top + bottom) / h;

    out[0] = 2 / w;
    out[1] = 0;
    out[2] = 0;
    out[3] = 2 / h;
    out[4] = -x;
    out[5] = -y;

    return out;
};

mat32.equal = function(a, b) {
    return !(
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5]
    );
};

mat32.notEqual = function(a, b) {
    return (
        a[0] !== b[0] ||
        a[1] !== b[1] ||
        a[2] !== b[2] ||
        a[3] !== b[3] ||
        a[4] !== b[4] ||
        a[5] !== b[5]
    );
};


},
function(require, exports, module, global) {

var ComponentManager = require(159);


var Transform2DManagerPrototype;


module.exports = Transform2DManager;


function Transform2DManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(Transform2DManager, "odin.Transform2DManager", 9999);
Transform2DManagerPrototype = Transform2DManager.prototype;

Transform2DManagerPrototype.sortFunction = function(a, b) {
    return a.entity.depth - b.entity.depth;
};


},
function(require, exports, module, global) {

var isNumber = require(34),
    Component = require(160),
    CameraManager = require(167),
    mathf = require(32),
    vec2 = require(64),
    vec3 = require(36),
    mat4 = require(76),
    color = require(35);


var ComponentPrototype = Component.prototype,
    CameraPrototype;


module.exports = Camera;


function Camera() {

    Component.call(this);

    this.width = 960;
    this.height = 640;
    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.autoResize = true;
    this.background = color.create(0.5, 0.5, 0.5);

    this.aspect = this.width / this.height;
    this.fov = 35;

    this.near = 0.0625;
    this.far = 16384;

    this.orthographic = false;
    this.orthographicSize = 2;

    this.minOrthographicSize = mathf.EPSILON;
    this.maxOrthographicSize = 1024;

    this.projection = mat4.create();
    this.view = mat4.create();

    this.needsUpdate = true;
    this.__active = false;
}
Component.extend(Camera, "odin.Camera", CameraManager);
CameraPrototype = Camera.prototype;

CameraPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.width = isNumber(options.width) ? options.width : 960;
    this.height = isNumber(options.height) ? options.height : 640;
    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.autoResize = options.autoResize != null ? !!options.autoResize : true;
    if (options.background) {
        color.copy(this.background, options.background);
    }

    this.aspect = this.width / this.height;
    this.fov = isNumber(options.fov) ? options.fov : 35;

    this.near = isNumber(options.near) ? options.near : 0.0625;
    this.far = isNumber(options.far) ? options.far : 16384;

    this.orthographic = options.orthographic != null ? !!options.orthographic : false;
    this.orthographicSize = isNumber(options.orthographicSize) ? options.orthographicSize : 2;

    this.needsUpdate = true;
    this.__active = false;

    return this;
};

CameraPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    color.set(this.background, 0.5, 0.5, 0.5);

    mat4.identity(this.projection);
    mat4.identity(this.view);

    this.needsUpdate = true;
    this.__active = false;

    return this;
};

CameraPrototype.set = function(width, height) {

    this.width = width;
    this.height = height;

    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.aspect = width / height;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.setActive = function() {
    var manager = this.manager;

    if (manager) {
        manager.setActive(this);
    } else {
        this.__active = true;
    }

    return this;
};

CameraPrototype.setWidth = function(width) {

    this.width = width;
    this.aspect = width / this.height;

    this.invWidth = 1 / this.width;

    this.needsUpdate = true;

    return this;
};

CameraPrototype.setHeight = function(height) {

    this.height = height;
    this.aspect = this.width / height;

    this.invHeight = 1 / this.height;

    this.needsUpdate = true;

    return this;
};

CameraPrototype.setFov = function(value) {

    this.fov = value;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.setNear = function(value) {

    this.near = value;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.setFar = function(value) {

    this.far = value;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.setOrthographic = function(value) {

    this.orthographic = !!value;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.toggleOrthographic = function() {

    this.orthographic = !this.orthographic;
    this.needsUpdate = true;

    return this;
};

CameraPrototype.setOrthographicSize = function(size) {

    this.orthographicSize = mathf.clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
    this.needsUpdate = true;

    return this;
};

var MAT4 = mat4.create(),
    VEC3 = vec3.create();

CameraPrototype.toWorld = function(v, out) {
    out = out || vec3.create();

    out[0] = 2.0 * (v[0] * this.invWidth) - 1.0;
    out[1] = -2.0 * (v[1] * this.invHeight) + 1.0;


    mat4.mul(MAT4, this.projection, this.view);
    vec3.transformMat4(out, out, mat4.inverse(MAT4, MAT4));
    out[2] = this.near;

    return out;
};


CameraPrototype.toScreen = function(v, out) {
    out = out || vec2.create();

    vec3.copy(VEC3, v);

    mat4.mul(MAT4, this.projection, this.view);
    vec3.transformMat4(out, VEC3, MAT4);

    out[0] = ((VEC3[0] + 1.0) * 0.5) * this.width;
    out[1] = ((1.0 - VEC3[1]) * 0.5) * this.height;

    return out;
};

CameraPrototype.update = function(force) {
    var entity = this.entity,
        transform = entity && (entity.components["odin.Transform"] || entity.components["odin.Transform2D"]),
        orthographicSize, right, left, top, bottom;

    if (force || this.__active) {
        if (this.needsUpdate) {
            if (!this.orthographic) {
                mat4.perspective(this.projection, mathf.degsToRads(this.fov), this.aspect, this.near, this.far);
            } else {
                this.orthographicSize = mathf.clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                orthographicSize = this.orthographicSize;
                right = orthographicSize * this.aspect;
                left = -right;
                top = orthographicSize;
                bottom = -top;

                mat4.orthographic(this.projection, left, right, top, bottom, this.near, this.far);
            }

            this.needsUpdate = false;
        }

        if (transform) {
            mat4.inverse(this.view, transform.getMatrixWorld());
        }
    }

    return this;
};

CameraPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.__active = this.__active;

    json.width = this.width;
    json.height = this.height;
    json.aspect = this.aspect;

    json.autoResize = this.autoResize;
    json.background = color.copy(json.background || [], this.background);

    json.far = this.far;
    json.near = this.near;
    json.fov = this.fov;

    json.orthographic = this.orthographic;
    json.orthographicSize = this.orthographicSize;
    json.minOrthographicSize = this.minOrthographicSize;
    json.maxOrthographicSize = this.maxOrthographicSize;

    return json;
};

CameraPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.__active = json.__active;

    this.width = json.width;
    this.height = json.height;
    this.aspect = json.aspect;

    this.autoResize = json.autoResize;
    color.copy(this.background, json.background);

    this.far = json.far;
    this.near = json.near;
    this.fov = json.fov;

    this.orthographic = json.orthographic;
    this.orthographicSize = json.orthographicSize;
    this.minOrthographicSize = json.minOrthographicSize;
    this.maxOrthographicSize = json.maxOrthographicSize;

    this.needsUpdate = true;

    return this;
};


},
function(require, exports, module, global) {

var ComponentManager = require(159);


var ComponentManagerPrototype = ComponentManager.prototype,
    CameraManagerPrototype;


module.exports = CameraManager;


function CameraManager() {

    ComponentManager.call(this);

    this.__active = null;
}
ComponentManager.extend(CameraManager, "odin.CameraManager");
CameraManagerPrototype = CameraManager.prototype;

CameraManagerPrototype.construct = function() {

    ComponentManagerPrototype.construct.call(this);

    return this;
};

CameraManagerPrototype.destructor = function() {

    ComponentManagerPrototype.destructor.call(this);

    this.__active = null;

    return this;
};

CameraManagerPrototype.sortFunction = function(a, b) {
    return a.__active ? 1 : (b.__active ? -1 : 0);
};

CameraManagerPrototype.setActive = function(camera) {
    if (this.__active) {
        this.__active.__active = false;
    }

    camera.__active = true;
    this.__active = camera;

    this.sort();

    return this;
};

CameraManagerPrototype.getActive = function() {
    return this.__active;
};

CameraManagerPrototype.add = function(component) {

    ComponentManagerPrototype.add.call(this, component);

    if (component.__active) {
        this.setActive(component);
    }

    return this;
};

CameraManagerPrototype.remove = function(component) {

    ComponentManagerPrototype.remove.call(this, component);

    if (component.__active) {
        this.__active = null;
    }

    return this;
};


},
function(require, exports, module, global) {

var isNumber = require(34),
    Component = require(160),
    SpriteManager = require(169);


var ComponentPrototype = Component.prototype,
    SpritePrototype;


module.exports = Sprite;


function Sprite() {

    Component.call(this);

    this.visible = true;

    this.layer = 0;
    this.z = 0;

    this.alpha = 1;

    this.material = null;

    this.width = 1;
    this.height = 1;

    this.x = 0;
    this.y = 0;

    this.w = 1;
    this.h = 1;
}
Component.extend(Sprite, "odin.Sprite", SpriteManager);
SpritePrototype = Sprite.prototype;

SpritePrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    if (options) {
        this.visible = options.visible != null ? !!options.visible : true;

        this.layer = isNumber(options.layer) ? (options.layer < 0 ? 0 : options.layer) : 0;
        this.z = isNumber(options.z) ? options.z : 0;

        this.alpha = options.alpha != null ? options.alpha : 1;

        this.material = options.material != null ? options.material : null;

        this.width = isNumber(options.width) ? options.width : 1;
        this.height = isNumber(options.height) ? options.height : 1;

        this.x = isNumber(options.x) ? options.x : 0;
        this.y = isNumber(options.y) ? options.y : 0;
        this.w = isNumber(options.w) ? options.w : 1;
        this.h = isNumber(options.h) ? options.h : 1;
    }

    return this;
};

SpritePrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.visible = true;

    this.layer = 0;
    this.z = 0;

    this.alpha = 1;

    this.material = null;

    this.width = 1;
    this.height = 1;

    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;

    return this;
};

SpritePrototype.setLayer = function(layer) {
    var manager = this.manager;

    if (manager) {
        layer = isNumber(layer) ? (layer < 0 ? 0 : layer) : this.layer;

        if (layer !== this.layer) {
            manager.removeComponent(this);
            this.layer = layer;
            manager.addComponent(this);
            manager.setLayerAsDirty(layer);
        }
    } else {
        this.layer = isNumber(layer) ? (layer < 0 ? 0 : layer) : this.layer;
    }

    return this;
};

SpritePrototype.setZ = function(z) {
    var manager = this.manager;

    if (manager) {
        z = isNumber(z) ? z : this.z;

        if (z !== this.z) {
            this.z = z;
            manager.setLayerAsDirty(this.layer);
        }
    } else {
        this.z = isNumber(z) ? z : this.z;
    }

    return this;
};

SpritePrototype.setMaterial = function(material) {
    this.material = material;
    return this;
};

SpritePrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.material = this.material.name;

    return json;
};

SpritePrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.material = this.entity.scene.assets.get(json.material);

    return this;
};


},
function(require, exports, module, global) {

var indexOf = require(57),
    ComponentManager = require(159);


var SpriteManagerPrototype;


module.exports = SpriteManager;


function SpriteManager() {
    this.scene = null;
    this.__layers = [];
    this.__dirtyLayers = [];
}
ComponentManager.extend(SpriteManager, "odin.SpriteManager");
SpriteManagerPrototype = SpriteManager.prototype;

SpriteManagerPrototype.construct = function() {
    return this;
};

SpriteManagerPrototype.destructor = function() {

    this.scene = null;
    this.__layers.length = 0;
    this.__dirtyLayers.length = 0;

    return this;
};

SpriteManagerPrototype.isEmpty = function() {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer;

    while (i++ < il) {
        layer = layers[i];

        if (layer && layer.length !== 0) {
            return false;
        }
    }

    return true;
};

SpriteManagerPrototype.sort = function() {
    var sortFunction = this.sortFunction,
        layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer;

    while (i++ < il) {
        layer = layers[i];

        if (layer && layer.length !== 0) {
            layer.sort(sortFunction);
        }
    }

    return this;
};

SpriteManagerPrototype.sortLayer = function(index) {
    var layer = this.__layers[index];

    if (layer && layer.length !== 0) {
        layer.sort(this.sortFunction);
    }

    return this;
};

SpriteManagerPrototype.sortFunction = function(a, b) {
    return a.z - b.z;
};

SpriteManagerPrototype.setLayerAsDirty = function(layer) {
    this.__dirtyLayers[layer] = true;
    return this;
};

function init(component) {
    component.awake();
}
SpriteManagerPrototype.init = function() {
    this.forEach(init);
    return this;
};

function awake(component) {
    component.awake();
}
SpriteManagerPrototype.awake = function() {
    this.forEach(awake);
    return this;
};

SpriteManagerPrototype.update = function() {
    var layers = this.__layers,
        dirtyLayers = this.__dirtyLayers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            if (dirtyLayers[i]) {
                this.sortLayer(i);
                dirtyLayers[i] = false;
            }

            j = -1;
            while (j++ < jl) {
                layer[j].update();
            }
        }
    }

    return this;
};

SpriteManagerPrototype.forEach = function(callback) {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            j = -1;
            while (j++ < jl) {
                if (callback(layer[j], j) === false) {
                    return false;
                }
            }
        }
    }

    return true;
};

SpriteManagerPrototype.has = function(component) {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            j = -1;
            while (j++ < jl) {
                if (component === layer[j]) {
                    return true;
                }
            }
        }
    }

    return false;
};

SpriteManagerPrototype.addComponent = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer] || (layers[componentLayer] = []),
        index = indexOf(layer, component);

    if (index === -1) {
        layer[layer.length] = component;
    }

    return this;
};

SpriteManagerPrototype.removeComponent = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer],
        index = layer ? indexOf(layer, component) : -1;

    if (index !== -1) {
        layer.splice(index, 1);
    }

    return this;
};


},
function(require, exports, module, global) {

var Component = require(160),
    Bone = require(171),
    Transform = require(161),
    Entity = require(117),
    MeshManager = require(173);


var ComponentPrototype = Component.prototype,
    MeshPrototype;


module.exports = Mesh;


function Mesh() {

    Component.call(this);

    this.geometry = null;
    this.material = null;
    this.bones = [];
    this.bone = {};
}
Component.extend(Mesh, "odin.Mesh", MeshManager);
MeshPrototype = Mesh.prototype;

MeshPrototype.construct = function(geometry, material) {

    ComponentPrototype.construct.call(this);

    this.geometry = geometry;
    this.material = material;

    return this;
};

MeshPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.geometry = null;
    this.material = null;
    this.bones.length = 0;
    this.bone = {};

    return this;
};

MeshPrototype.awake = function() {
    var geoBones = this.geometry.bones,
        i = -1,
        il = geoBones.length - 1,
        entity, bones, boneHash, geoBone, bone, transform, childEntity, parent;

    if (il !== -1) {
        entity = this.entity;
        bones = this.bones;
        boneHash = this.bone;

        while (i++ < il) {
            geoBone = geoBones[i];
            bone = Bone.create(geoBone);
            transform = Transform.create()
                .setPosition(geoBone.position)
                .setScale(geoBone.scale)
                .setRotation(geoBone.rotation);

            childEntity = Entity.create().addComponent(transform, bone);
            bones[bones.length] = childEntity;
            parent = bones[bone.parentIndex] || entity;
            parent.addChild(childEntity);
            boneHash[bone.name] = childEntity;
        }
    }

    ComponentPrototype.awake.call(this);

    return this;
};

MeshPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.geometry = this.geometry.name;
    json.material = this.material.name;

    return json;
};

MeshPrototype.fromJSON = function(json) {
    var assets = this.entity.scene.assets;

    ComponentPrototype.fromJSON.call(this, json);

    this.geometry = assets.get(json.geometry);
    this.material = assets.get(json.material);

    return this;
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    quat = require(147),
    mat4 = require(76),
    Component = require(160),
    BoneManager = require(172);


var ComponentPrototype = Component.prototype,
    UNKNOWN_BONE_COUNT = 1,
    BonePrototype;


module.exports = Bone;


function Bone() {

    Component.call(this);

    this.parentIndex = -1;
    this.name = null;

    this.skinned = false;
    this.bindPose = mat4.create();
    this.uniform = mat4.create();

    this.inheritPosition = true;
    this.inheritRotation = true;
    this.inheritScale = true;
}
Component.extend(Bone, "odin.Bone", BoneManager);
BonePrototype = Bone.prototype;

BonePrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.parentIndex = options.parentIndex != null ? options.parentIndex : -1;
    this.name = options.name != null ? options.name : "Bone" + UNKNOWN_BONE_COUNT++;

    this.skinned = options.skinned != null ? !!options.skinned : false;

    if (options.bindPose) {
        mat4.copy(this.bindPose, options.bindPose);
    }

    this.inheritPosition = options.inheritPosition != null ? !!options.inheritPosition : true;
    this.inheritRotation = options.inheritRotation != null ? !!options.inheritRotation : true;
    this.inheritScale = options.inheritScale != null ? !!options.inheritScale : true;

    return this;
};

BonePrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.parentIndex = null;
    this.name = null;

    this.skinned = null;
    mat4.identity(this.bindPose);
    mat4.identity(this.uniform);

    this.inheritPosition = true;
    this.inheritRotation = true;
    this.inheritScale = true;

    return this;
};

var MAT = mat4.create(),
    POSITION = vec3.create(),
    SCALE = vec3.create(),
    ROTATION = quat.create();

BonePrototype.update = function() {
    var entity = this.entity,
        transform = entity.components["odin.Transform"],
        uniform = this.uniform,
        inheritPosition, inheritScale, inheritRotation,
        mat, position, scale, rotation,
        parent;

    mat4.copy(uniform, transform.matrix);

    if (this.skinned === false) {
        return this;
    }

    parent = entity.parent;

    if (parent && this.parentIndex !== -1) {
        mat = MAT;
        mat4.copy(mat, parent.components["odin.Bone"].uniform);

        inheritPosition = this.inheritPosition;
        inheritScale = this.inheritScale;
        inheritRotation = this.inheritRotation;

        if (!inheritPosition || !inheritScale || !inheritRotation) {

            position = POSITION;
            scale = SCALE;
            rotation = ROTATION;

            mat4.decompose(mat, position, scale, rotation);

            if (!inheritPosition) {
                vec3.set(position, 0, 0, 0);
            }
            if (!inheritScale) {
                vec3.set(scale, 1, 1, 1);
            }
            if (!inheritRotation) {
                quat.set(rotation, 0, 0, 0, 1);
            }

            mat4.compose(mat, position, scale, rotation);
        }

        mat4.mul(uniform, mat, uniform);
    }

    return this;
};

BonePrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

BonePrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};


},
function(require, exports, module, global) {

var ComponentManager = require(159);


var BoneManagerPrototype;


module.exports = BoneManager;


function BoneManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(BoneManager, "odin.BoneManager", 10000);
BoneManagerPrototype = BoneManager.prototype;

BoneManagerPrototype.sortFunction = function(a, b) {
    return a.parentIndex - b.parentIndex;
};


},
function(require, exports, module, global) {

var ComponentManager = require(159);


var MeshManagerPrototype;


module.exports = MeshManager;


function MeshManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(MeshManager, "odin.MeshManager");
MeshManagerPrototype = MeshManager.prototype;

MeshManagerPrototype.sortFunction = function(a, b) {
    return a.geometry !== b.geometry ? 1 : (a.material !== b.material ? 1 : 0);
};


},
function(require, exports, module, global) {

var vec3 = require(36),
    quat = require(147),
    mathf = require(32),
    Component = require(160),
    wrapMode = require(90);


var ComponentPrototype = Component.prototype,
    MeshAnimationPrototype;


module.exports = MeshAnimation;


function MeshAnimation() {

    Component.call(this);

    this.animations = null;

    this.current = "idle";
    this.mode = wrapMode.LOOP;

    this.rate = 1 / 24;
    this.playing = false;

    this.__time = 0;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
}
Component.extend(MeshAnimation, "odin.MeshAnimation");
MeshAnimationPrototype = MeshAnimation.prototype;

MeshAnimationPrototype.construct = function(animations, options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.animations = animations;

    this.current = options.current != null ? options.current : "idle";
    this.mode = options.mode != null ? options.mode : wrapMode.LOOP;

    this.rate = options.rate != null ? options.rate : 1 / 24;
    this.playing = false;

    return this;
};

MeshAnimationPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.animations = null;

    this.current = "idle";
    this.mode = wrapMode.LOOP;

    this.rate = 1 / 24;
    this.playing = false;

    this.__time = 0;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;

    return this;
};

var update_position = vec3.create(),
    update_lastPosition = vec3.create(),
    update_scale = vec3.create(),
    update_lastScale = vec3.create(),
    update_rotation = quat.create(),
    update_lastRotation = quat.create();

MeshAnimationPrototype.update = function() {
    var alpha = 0,
        position, rotation, scale,
        lastPosition, lastRotation, lastScale,
        currentPosition, currentRotation, currentScale,
        boneCurrent, boneTransform, parentIndex, boneFrame, lastBoneFrame,
        current, count, length, order, frame, lastFrame, mode, frameState, lastFrameState, entity, bones, i, il;

    entity = this.entity;
    current = this.animations.data[this.current];

    if (!current) {
        return this;
    }

    order = this.__order;
    frame = this.__frame;
    lastFrame = this.__lastFrame;
    mode = this.mode;

    if (!this.rate || this.rate === Infinity || this.rate < 0) {
        frame = mathf.abs(frame) % current.length;
    } else {
        this.__time += entity.scene.time.delta;
        count = this.__time / this.rate;
        alpha = count;

        if (count >= 1) {
            lastFrame = frame;
            alpha = 0;

            this.__time = 0;
            length = current.length;
            frame += (order * (count | 0));

            if (mode === wrapMode.LOOP) {
                frame = frame % length;
            } else if (mode === wrapMode.ONCE) {
                if (order > 0) {
                    if (frame >= length) {
                        frame = length - 1;
                        this.stop();
                    }
                } else {
                    if (frame < 0) {
                        frame = 0;
                        this.stop();
                    }
                }
            } else if (mode === wrapMode.PING_PONG) {
                if (order > 0) {
                    if (frame >= length) {
                        this.__order = -1;
                        frame = length - 1;
                    }
                } else {
                    if (frame < 0) {
                        this.__order = 1;
                        frame = 0;
                    }
                }
            } else if (mode === wrapMode.CLAMP) {
                if (order > 0) {
                    if (frame >= length) {
                        frame = length - 1;
                    }
                } else {
                    if (frame < 0) {
                        frame = 0;
                    }
                }
            }
        }
    }

    alpha = mathf.clamp01(alpha);
    frameState = current[frame];
    lastFrameState = current[lastFrame] || frameState;

    currentPosition = update_position;
    currentRotation = update_rotation;
    currentScale = update_scale;

    lastPosition = update_lastPosition;
    lastRotation = update_lastRotation;
    lastScale = update_lastScale;

    bones = entity.components["odin.Mesh"].bones;
    i = -1;
    il = bones.length - 1;

    while (i++ < il) {
        boneCurrent = bones[i];

        boneTransform = boneCurrent.components["odin.Transform"];
        parentIndex = boneCurrent.parentIndex;

        position = boneTransform.position;
        rotation = boneTransform.rotation;
        scale = boneTransform.scale;

        boneFrame = frameState[i];
        lastBoneFrame = lastFrameState[i];

        lastPosition[0] = lastBoneFrame[0];
        lastPosition[1] = lastBoneFrame[1];
        lastPosition[2] = lastBoneFrame[2];

        lastRotation[0] = lastBoneFrame[3];
        lastRotation[1] = lastBoneFrame[4];
        lastRotation[2] = lastBoneFrame[5];
        lastRotation[3] = lastBoneFrame[6];

        lastScale[0] = lastBoneFrame[7];
        lastScale[1] = lastBoneFrame[8];
        lastScale[2] = lastBoneFrame[9];

        currentPosition[0] = boneFrame[0];
        currentPosition[1] = boneFrame[1];
        currentPosition[2] = boneFrame[2];

        currentRotation[0] = boneFrame[3];
        currentRotation[1] = boneFrame[4];
        currentRotation[2] = boneFrame[5];
        currentRotation[3] = boneFrame[6];

        currentScale[0] = boneFrame[7];
        currentScale[1] = boneFrame[8];
        currentScale[2] = boneFrame[9];

        vec3.lerp(position, lastPosition, currentPosition, alpha);
        quat.lerp(rotation, lastRotation, currentRotation, alpha);
        vec3.lerp(scale, lastScale, currentScale, alpha);
    }

    this.__frame = frame;
    this.__lastFrame = lastFrame;

    return this;
};

MeshAnimationPrototype.play = function(name, mode, rate) {
    if ((this.playing && this.current === name) || !this.animations.data[name]) {
        return this;
    }

    this.playing = true;

    this.current = name;
    this.rate = rate != null ? rate : (rate = this.rate);
    this.mode = mode || (mode = this.mode);
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
    this.__time = 0;

    this.emit("play", name, mode, rate);

    return this;
};

MeshAnimationPrototype.stop = function() {
    if (this.playing) {
        this.emit("stop");
    }

    this.playing = false;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
    this.__time = 0;

    return this;
};

MeshAnimationPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.animations = this.animations.name;

    return json;
};

MeshAnimationPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.animations = this.entity.scene.assets.get(json.animations);

    return this;
};


},
function(require, exports, module, global) {

var environment = require(1),
    mathf = require(32),
    vec3 = require(36),
    Component = require(160);


var ComponentPrototype = Component.prototype,

    MIN_POLOR = 0,
    MAX_POLOR = mathf.PI,

    NONE = 1,
    ROTATE = 2,
    PAN = 3,

    OrbitControlPrototype;


module.exports = OrbitControl;


function OrbitControl() {
    var _this = this;

    Component.call(this);

    this.speed = null;
    this.zoomSpeed = null;

    this.allowZoom = null;
    this.allowPan = null;
    this.allowRotate = null;

    this.target = vec3.create();

    this.__offset = vec3.create();
    this.__pan = vec3.create();
    this.__scale = null;
    this.__thetaDelta = null;
    this.__phiDelta = null;
    this.__state = null;

    this.onTouchStart = function(e, touch, touches) {
        OrbitControl_onTouchStart(_this, e, touch, touches);
    };
    this.onTouchEnd = function() {
        OrbitControl_onTouchEnd(_this);
    };
    this.onTouchMove = function(e, touch, touches) {
        OrbitControl_onTouchMove(_this, e, touch, touches);
    };

    this.onMouseUp = function() {
        OrbitControl_onMouseUp(_this);
    };
    this.onMouseDown = function(e, button, mouse) {
        OrbitControl_onMouseDown(_this, e, button, mouse);
    };
    this.onMouseMove = function(e, mouse) {
        OrbitControl_onMouseMove(_this, e, mouse);
    };
    this.onMouseWheel = function(e, wheel) {
        OrbitControl_onMouseWheel(_this, e, wheel);
    };
}
Component.extend(OrbitControl, "odin.OrbitControl");
OrbitControlPrototype = OrbitControl.prototype;

OrbitControlPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.speed = options.speed > mathf.EPSILON ? options.speed : 1;
    this.zoomSpeed = options.zoomSpeed > mathf.EPSILON ? options.zoomSpeed : 2;

    this.allowZoom = options.allowZoom != null ? !!options.allowZoom : true;
    this.allowPan = options.allowPan != null ? !!options.allowPan : true;
    this.allowRotate = options.allowRotate != null ? !!options.allowRotate : true;

    if (options.target) {
        vec3.copy(this.target, options.target);
    }

    this.__scale = 1;
    this.__thetaDelta = 0;
    this.__phiDelta = 0;
    this.__state = NONE;

    return this;
};

OrbitControlPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.speed = null;
    this.zoomSpeed = null;

    this.allowZoom = null;
    this.allowPan = null;
    this.allowRotate = null;

    vec3.set(this.target, 0, 0, 0);

    vec3.set(this.__offset, 0, 0, 0);
    vec3.set(this.__pan, 0, 0, 0);

    this.__scale = null;
    this.__thetaDelta = null;
    this.__phiDelta = null;
    this.__state = null;

    return this;
};

OrbitControlPrototype.awake = function() {
    var entity = this.entity,
        scene = entity.scene,
        input = scene.input;

    ComponentPrototype.awake.call(this);

    if (environment.mobile) {
        input.on("touchstart", this.onTouchStart);
        input.on("touchend", this.onTouchEnd);
        input.on("touchmove", this.onTouchMove);
    } else {
        input.on("mouseup", this.onMouseUp);
        input.on("mousedown", this.onMouseDown);
        input.on("mousemove", this.onMouseMove);
        input.on("wheel", this.onMouseWheel);
    }

    OrbitControl_update(this);

    return this;
};

OrbitControlPrototype.clear = function(emitEvent) {
    var entity = this.entity,
        scene = entity.scene,
        input = scene.input;

    ComponentPrototype.clear.call(this, emitEvent);

    if (environment.mobile) {
        input.off("touchstart", this.onTouchStart);
        input.off("touchend", this.onTouchEnd);
        input.off("touchmove", this.onTouchMove);
    } else {
        input.off("mouseup", this.onMouseUp);
        input.off("mousedown", this.onMouseDown);
        input.off("mousemove", this.onMouseMove);
        input.off("wheel", this.onMouseWheel);
    }

    return this;
};

OrbitControlPrototype.setTarget = function(target) {
    vec3.copy(this.target, target);
    return this;
};

function OrbitControl_update(_this) {
    var components = _this.entity.components,
        camera = components["odin.Camera"],
        transform = components["odin.Transform"],
        position = transform.position,
        target = _this.target,
        offset = _this.__offset,
        pan = _this.__pan,
        theta, phi, radius;

    vec3.sub(offset, position, target);
    theta = mathf.atan2(offset[0], offset[1]);
    phi = mathf.atan2(mathf.sqrt(offset[0] * offset[0] + offset[1] * offset[1]), offset[2]);

    theta += _this.__thetaDelta;
    phi += _this.__phiDelta;

    phi = mathf.max(MIN_POLOR, mathf.min(MAX_POLOR, phi));
    phi = mathf.max(mathf.EPSILON, mathf.min(mathf.PI - mathf.EPSILON, phi));

    radius = vec3.length(offset) * _this.__scale;

    if (camera.orthographic) {
        camera.setOrthographicSize(camera.orthographicSize * _this.__scale);
    }

    vec3.add(target, target, pan);

    offset[0] = radius * mathf.sin(phi) * mathf.sin(theta);
    offset[1] = radius * mathf.sin(phi) * mathf.cos(theta);
    offset[2] = radius * mathf.cos(phi);

    vec3.add(position, target, offset);
    transform.lookAt(target);

    _this.__scale = 1;
    _this.__thetaDelta = 0;
    _this.__phiDelta = 0;
    vec3.set(pan, 0, 0, 0);
}

var OrbitControl_pan_panOffset = vec3.create();

function OrbitControl_pan(_this, delta) {
    var panOffset = OrbitControl_pan_panOffset,
        pan = _this.__pan,
        camera = _this.entity.components["odin.Camera"],
        transform = _this.entity.components["odin.Transform"],
        matrixWorld = transform.matrixWorld,
        position = transform.position,
        targetDistance;

    vec3.sub(panOffset, position, _this.target);
    targetDistance = vec3.length(panOffset);

    if (!camera.orthographic) {
        targetDistance *= mathf.tan(mathf.degsToRads(camera.fov * 0.5));

        vec3.set(panOffset, matrixWorld[0], matrixWorld[1], matrixWorld[2]);
        vec3.smul(panOffset, panOffset, -2 * delta[0] * targetDistance * camera.invWidth);
        vec3.add(pan, pan, panOffset);

        vec3.set(panOffset, matrixWorld[4], matrixWorld[5], matrixWorld[6]);
        vec3.smul(panOffset, panOffset, 2 * delta[1] * targetDistance * camera.invHeight);
        vec3.add(pan, pan, panOffset);
    } else {
        targetDistance *= camera.orthographicSize * 0.5;

        vec3.set(panOffset, matrixWorld[0], matrixWorld[1], matrixWorld[2]);
        vec3.smul(panOffset, panOffset, -2 * delta[0] * targetDistance * camera.invWidth);
        vec3.add(pan, pan, panOffset);

        vec3.set(panOffset, matrixWorld[4], matrixWorld[5], matrixWorld[6]);
        vec3.smul(panOffset, panOffset, 2 * delta[1] * targetDistance * camera.invHeight);
        vec3.add(pan, pan, panOffset);
    }
}

function OrbitControl_onTouchStart(_this, e, touch, touches) {
    var length = touches.__array.length;

    if (length === 1) {
        _this.__state = ROTATE;
    } else if (length === 2 && _this.allowPan) {
        _this.__state = PAN;
    } else {
        _this.__state = NONE;
    }
}

function OrbitControl_onTouchEnd(_this) {
    _this.__state = NONE;
}

function OrbitControl_onTouchMove(_this, e, touch) {
    var delta = touch.delta,
        camera = _this.entity.components["odin.Camera"];

    if (_this.__state === ROTATE) {
        _this.__thetaDelta += 2 * mathf.PI * delta[0] * camera.invWidth * _this.speed;
        _this.__phiDelta -= 2 * mathf.PI * delta[1] * camera.invHeight * _this.speed;
        OrbitControl_update(_this);
    } else if (_this.__state === PAN) {
        OrbitControl_pan(_this, delta);
        OrbitControl_update(_this);
    }
}

function OrbitControl_onMouseUp(_this) {
    _this.__state = NONE;
}

var LEFT_MOUSE = "mouse0",
    MIDDLE_MOUSE = "mouse1";

function OrbitControl_onMouseDown(_this, e, button) {
    if (button.name === LEFT_MOUSE && _this.allowRotate) {
        _this.__state = ROTATE;
    } else if (button.name === MIDDLE_MOUSE && _this.allowPan) {
        _this.__state = PAN;
    } else {
        _this.__state = NONE;
    }
}

function OrbitControl_onMouseMove(_this, e, mouse) {
    var delta = mouse.delta,
        camera = _this.entity.components["odin.Camera"];

    if (_this.__state === ROTATE) {
        _this.__thetaDelta += 2 * mathf.PI * delta[0] * camera.invWidth * _this.speed;
        _this.__phiDelta -= 2 * mathf.PI * delta[1] * camera.invHeight * _this.speed;
        OrbitControl_update(_this);
    } else if (_this.__state === PAN) {
        OrbitControl_pan(_this, delta);
        OrbitControl_update(_this);
    }
}

function OrbitControl_onMouseWheel(_this, e, wheel) {
    if (_this.allowZoom) {
        if (wheel < 0) {
            _this.__scale *= mathf.pow(0.95, _this.zoomSpeed);
            OrbitControl_update(_this);
        } else {
            _this.__scale /= mathf.pow(0.95, _this.zoomSpeed);
            OrbitControl_update(_this);
        }
    }
}


},
function(require, exports, module, global) {

var indexOf = require(57),
    Component = require(160);


var ComponentPrototype = Component.prototype,
    ParticleSystemPrototype;


module.exports = ParticleSystem;


function ParticleSystem() {

    Component.call(this);

    this.playing = null;

    this.emitters = [];
    this.__emitterHash = {};
}
Component.extend(ParticleSystem, "odin.ParticleSystem");
ParticleSystemPrototype = ParticleSystem.prototype;

ParticleSystem.Emitter = require(177);
ParticleSystem.Emitter2D = require(178);

ParticleSystemPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    this.playing = options.playing ? !!options.playing : false;

    return this;
};

ParticleSystemPrototype.destructor = function() {
    var emitters = this.emitters,
        i = -1,
        il = emitters.length - 1;

    ComponentPrototype.destructor.call(this);

    this.playing = null;

    while (i++ < il) {
        this.removeEmitter(emitters[i]);
    }

    return this;
};

ParticleSystemPrototype.addEmitter = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ParticleSystem_addEmitter(this, arguments[i]);
    }

    return this;
};

function ParticleSystem_addEmitter(_this, emitter) {
    var emitters = this.emitters,
        index = indexOf(emitters, emitter);

    if (index === -1) {
        emitters[emitters.length] = emitter;
        this.__emitterHash[emitter.__id] = emitter;
        emitter.particleSystem = this;
    } else {
        throw new Error("ParticleSystem addEmitter(emitter): emitter already in particle system");
    }

    return this;
}

ParticleSystemPrototype.removeEmitter = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ParticleSystem_removeEmitter(this, arguments[i]);
    }

    return this;
};

function ParticleSystem_removeEmitter(_this, emitter) {
    var emitters = this.emitters,
        index = indexOf(emitters, emitter);

    if (index !== -1) {
        emitter.clear();
        emitter.particleSystem = null;

        emitters.splice(index, 1);
        delete this.__emitterHash[emitter.__id];
    } else {
        throw new Error("ParticleSystem removeEmitter(emitter): emitter not in particle system");
    }

    return this;
}

ParticleSystemPrototype.update = function() {
    var dt, emitters, playing, i, il, emitter;

    if (this.playing) {
        dt = this.entity.scene.time.delta;
        emitters = this.emitters;
        playing = false;
        i = -1,
            il = emitters.length - 1;

        while (i++ < il) {
            emitter = emitters[i];
            emitter.update(dt);

            if (!playing && emitter.playing) {
                playing = true;
            }
        }

        if (!playing) {
            this.playing = playing;
            this.emit("end");
        }
    }

    return this;
};

ParticleSystemPrototype.play = function() {
    var emitters, i, il;

    if (!this.playing) {
        emitters = this.emitters;
        i = -1;
        il = emitters.length - 1;

        while (i++ < il) {
            emitters[i].play();
        }

        this.playing = true;
        this.emit("play");
    }

    return this;
};

ParticleSystemPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

ParticleSystemPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};


},
function(require, exports, module, global) {

var Class = require(9);


var ClassPrototype = Class.prototype,
    EmitterPrototype;


module.exports = Emitter;


function Emitter() {
    Class.call(this);
}
Class.extend(Emitter, "odin.ParticleSystem.Emitter");
EmitterPrototype = Emitter.prototype;

EmitterPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

EmitterPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    return this;
};

EmitterPrototype.update = function() {
    return this;
};

EmitterPrototype.toJSON = function(json) {

    json = ClassPrototype.toJSON.call(this, json);

    return json;
};

EmitterPrototype.fromJSON = function(json) {

    ClassPrototype.fromJSON.call(this, json);

    return this;
};


},
function(require, exports, module, global) {

var mathf = require(32),
    isNumber = require(34),
    Class = require(9),
    randInt = require(179),
    randFloat = require(180),
    createSeededRandom = require(181),
    Particle2D = require(182);


var MAX_SAFE_INTEGER = mathf.pow(2, 53) - 1,
    ClassPrototype = Class.prototype,
    Emitter2DPrototype;


module.exports = Emitter2D;


function Emitter2D() {
    var _this = this;

    Class.call(this);

    this.seed = null;
    this.__random = null;

    this.minEmission = null;
    this.maxEmission = null;

    this.playing = false;

    this.particleSystem = null;

    this.startTime = null;
    this.currentTime = null;

    this.particles = [];

    this.random = function random() {
        return _this.__random(this.currentTime);
    };
}
Class.extend(Emitter2D, "odin.ParticleSystem.Emitter2D");
Emitter2DPrototype = Emitter2D.prototype;

Emitter2DPrototype.construct = function(options) {

    ClassPrototype.construct.call(this);

    options = options || {};

    this.seed = mathf.floor(isNumber(options.seed) ? (
        options.seed > MAX_SAFE_INTEGER ? MAX_SAFE_INTEGER : options.seed
    ) : (mathf.random() * MAX_SAFE_INTEGER));

    this.__random = createSeededRandom(this.seed);

    this.minEmission = options.minEmission != null ? options.minEmission : 1;
    this.maxEmission = options.maxEmission != null ? options.maxEmission : 2;

    this.playing = false;

    this.startTime = 0.0;
    this.currentTime = 0.0;

    return this;
};

Emitter2DPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.seed = null;
    this.__random = null;

    this.minEmission = null;
    this.maxEmission = null;

    this.playing = false;

    this.startTime = 0.0;
    this.currentTime = 0.0;

    this.particles.length = 0;

    return this;
};

Emitter2DPrototype.update = function() {

    this.currentTime = this.particleSystem.entity.scene.time.time - this.startTime;

    return this;
};

Emitter2DPrototype.spawn = function() {
    var count = randInt(this.random, this.minEmission, this.maxEmission);

    console.log(count);

    return this;
};

Emitter2DPrototype.play = function() {
    if (!this.playing) {
        this.startTime = this.particleSystem.entity.scene.time.time;
        this.playing = true;
    }
    return this;
};

Emitter2DPrototype.toJSON = function(json) {

    json = ClassPrototype.toJSON.call(this, json);

    json.seed = this.seed;

    return json;
};

Emitter2DPrototype.fromJSON = function(json) {

    ClassPrototype.fromJSON.call(this, json);

    this.seed = json.seed;
    this.__random = createSeededRandom(this.seed);

    return this;
};


},
function(require, exports, module, global) {

module.exports = randInt;


function randInt(random, min, max) {
    return (min + (random() * (max - min))) >>> 0;
}


},
function(require, exports, module, global) {

module.exports = randFloat;


function randFloat(random, min, max) {
    return min + (random() * (max - min));
}


},
function(require, exports, module, global) {

var MULTIPLIER = 1664525,
    MODULO = 4294967295,
    OFFSET = 1013904223;


module.exports = createSeededRandom;


function createSeededRandom(seed) {
    return function random(s) {
        return ((MULTIPLIER * (seed + (s * 1000)) + OFFSET) % MODULO) / MODULO;
    };
}


},
function(require, exports, module, global) {

var vec2 = require(64),
    color = require(35),
    createPool = require(102);


var Particle2DPrototype;


module.exports = Particle2D;


function Particle2D() {
    this.z = 1;
    this.alpha = 1;

    this.lifeTime = 0;
    this.life = 1;

    this.size = 1;

    this.color = color.create();

    this.position = vec2.create();
    this.velocity = vec2.create();
    this.acceleration = vec2.create();

    this.angle = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
}
createPool(Particle2D);
Particle2DPrototype = Particle2D.prototype;

Particle2DPrototype.update = function(dt) {
    var pos = this.position,
        vel = this.velocity,
        acc = this.acceleration;

    vel[0] += acc[0] * dt;
    vel[1] += acc[1] * dt;

    pos[0] += vel[0] * dt;
    pos[1] += vel[1] * dt;

    this.angularVelocity += this.angularAcceleration * dt;
    this.angle += this.angularVelocity * dt;

    this.lifeTime += dt;
};


}], void 0, (new Function("return this;"))()));
