var Component = require("./component"),
    CameraManager = require("../component_managers/camera_manager"),
    mathf = require("mathf"),
    vec2 = require("vec2"),
    vec3 = require("vec3"),
    mat4 = require("mat4"),
    color = require("color");


var ComponentPrototype = Component.prototype;


module.exports = Camera;


function Camera() {

    Component.call(this);
}
Component.extend(Camera, "Camera", CameraManager);


Camera.prototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.width = 960;
    this.height = 640;
    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.autoResize = options.autoResize != null ? !!options.autoResize : true;
    this.background = options.background != null ? options.background : color.create(0.5, 0.5, 0.5);

    this.aspect = this.width / this.height;
    this.fov = options.fov != null ? options.fov : 35;

    this.near = options.near != null ? options.near : 0.0625;
    this.far = options.far != null ? options.far : 16384;

    this.orthographic = options.orthographic != null ? !!options.orthographic : false;
    this.orthographicSize = options.orthographicSize != null ? options.orthographicSize : 2;

    this.minOrthographicSize = options.minOrthographicSize != null ? options.minOrthographicSize : mathf.EPSILON;
    this.maxOrthographicSize = options.maxOrthographicSize != null ? options.maxOrthographicSize : 1024;

    this.projection = mat4.create();
    this.view = mat4.create();

    this.needsUpdate = true;
    this.__active = false;

    return this;
};

Camera.prototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.width = null;
    this.height = null;
    this.invWidth = null;
    this.invHeight = null;

    this.autoResize = null;
    this.background = null;

    this.aspect = null;
    this.fov = null;

    this.near = null;
    this.far = null;

    this.orthographic = null;
    this.orthographicSize = null;

    this.minOrthographicSize = null;
    this.maxOrthographicSize = null;

    this.projection = null;
    this.view = null;

    this.needsUpdate = null;
    this.__active = null;

    return this;
};

Camera.prototype.set = function(width, height) {

    this.width = width;
    this.height = height;

    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.aspect = width / height;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.setWidth = function(width) {

    this.width = width;
    this.aspect = width / this.height;

    this.invWidth = 1 / this.width;

    this.needsUpdate = true;

    return this;
};

Camera.prototype.setHeight = function(height) {

    this.height = height;
    this.aspect = this.width / height;

    this.invHeight = 1 / this.height;

    this.needsUpdate = true;

    return this;
};

Camera.prototype.setFov = function(value) {

    this.fov = value;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.setNear = function(value) {

    this.near = value;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.setFar = function(value) {

    this.far = value;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.setOrthographic = function(value) {

    this.orthographic = !!value;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.toggleOrthographic = function() {

    this.orthographic = !this.orthographic;
    this.needsUpdate = true;

    return this;
};

Camera.prototype.setOrthographicSize = function(size) {

    this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
    this.needsUpdate = true;

    return this;
};

var MAT4 = mat4.create(),
    VEC3 = vec3.create();

Camera.prototype.toWorld = function(v, out) {
    out = out || vec3.create();

    out[0] = 2.0 * (v[0] * this.invWidth) - 1.0;
    out[1] = -2.0 * (v[1] * this.invHeight) + 1.0;


    mat4.mul(MAT4, this.projection, this.view);
    vec3.transformMat4(out, out, mat4.inverse(MAT4, MAT4));
    out[2] = this.near;

    return out;
};


Camera.prototype.toScreen = function(v, out) {
    out = out || vec2.create();

    vec3.copy(VEC3, v);

    mat4.mul(MAT4, this.projection, this.view);
    vec3.transformMat4(out, VEC3, MAT4);

    out[0] = ((VEC3[0] + 1) * 0.5) * this.width;
    out[1] = ((1 - VEC3[1]) * 0.5) * this.height;

    return out;
};

Camera.prototype.update = function(force) {
    var sceneObject = this.sceneObject,
        transform = sceneObject && (sceneObject.getComponent("Transform") || sceneObject.getComponent("Transform2D")),
        orthographicSize, right, left, top, bottom;

    ComponentPrototype.update.call(this);

    if (!force && !this.__active) {
        return this;
    }

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
        mat4.inverse(this.view, transform.matrixWorld);
    }

    return this;
};

Camera.prototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

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

Camera.prototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

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
