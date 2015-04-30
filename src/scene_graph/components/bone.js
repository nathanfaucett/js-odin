var vec3 = require("vec3"),
    quat = require("quat"),
    mat4 = require("mat4"),
    Component = require("./component"),
    BoneManager = require("../component_managers/bone_manager");


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
Component.extend(Bone, "Bone", BoneManager);
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
    var sceneObject = this.sceneObject,
        transform = sceneObject.components.Transform,
        uniform = this.uniform,
        inheritPosition, inheritScale, inheritRotation = this.inheritRotation,
        mat, position, scale, rotation,
        parent;

    ComponentPrototype.update.call(this);

    mat4.copy(uniform, transform.matrix);

    if (this.skinned === false) {
        return this;
    }

    parent = sceneObject.parent;

    if (parent && this.parentIndex !== -1) {
        mat = MAT;
        mat4.copy(mat, parent.components.Bone.uniform);

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
