var environment = require("environment"),
    mathf = require("mathf"),
    vec3 = require("vec3"),
    Component = require("./component");


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
Component.extend(OrbitControl, "OrbitControl");
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

function OrbitControl_update(_this) {
    var components = _this.entity.components,
        camera = components.Camera,
        transform = components.Transform,
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
        camera = _this.entity.components.Camera,
        transform = _this.entity.components.Transform,
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
        camera = _this.entity.components.Camera;

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
        camera = _this.entity.components.Camera;

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
