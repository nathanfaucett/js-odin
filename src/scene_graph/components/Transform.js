var vec3 = require("vec3"),
    quat = require("quat"),
    mat3 = require("mat3"),
    mat4 = require("mat4"),
    Component = require("./Component"),
    TransformManager = require("../component_managers/TransformManager");


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
Component.extend(Transform, "Transform", TransformManager);
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
        parentTransform = parent && parent.components.Transform;

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
