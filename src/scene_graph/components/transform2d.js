var Component = require("./component"),
    Transform2DManager = require("../component_managers/transform_manager"),
    vec2 = require("vec2"),
    mat3 = require("mat3"),
    mat32 = require("mat32"),
    mat4 = require("mat4");


var ComponentPrototype = Component.prototype,
    Transform2DPrototype;


module.exports = Transform2D;


function Transform2D() {

    Component.call(this);

    this.position = vec2.create();
    this.rotation = 0;
    this.scale = vec2.create(1, 1);

    this.matrix = mat32.create();
    this.matrixWorld = mat32.create();
}
Component.extend(Transform2D, "Transform2D", Transform2DManager);
Transform2DPrototype = Transform2D.prototype;

Transform2DPrototype.construct = function() {

    ComponentPrototype.construct.call(this);

    return this;
};

Transform2DPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    vec2.set(this.position, 0, 0);
    this.rotation = 0;
    vec2.set(this.scale, 1, 1);

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
        vec2.transformMat4(vec, vec2.set(vec, 0, 0), target.matrixWorld);
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
        parentTransform2D = parent && parent.components.Transform2D;

    ComponentPrototype.update.call(this);

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
