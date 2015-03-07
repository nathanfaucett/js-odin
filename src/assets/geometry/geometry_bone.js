var vec3 = require("vec3"),
    quat = require("quat"),
    mat4 = require("mat4");


var UNKNOWN_BONE_COUNT = 1;


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

GeometryBone.create = function(parentIndex, name) {
    return (new GeometryBone()).construct(parentIndex, name);
};

GeometryBone.prototype.construct = function(parentIndex, name) {

    this.parentIndex = parentIndex != null ? parentIndex : -1;
    this.name = name != null ? name : "GeometryBone" + UNKNOWN_BONE_COUNT++;
    this.skinned = false;

    return this;
};

GeometryBone.prototype.destructor = function() {

    this.parentIndex = null;
    this.name = null;

    this.skinned = null;
    vec3.set(this.position, 0, 0, 0);
    quat.set(this.rotation, 0, 0, 0, 1);
    vec3.set(this.scale, 1, 1, 1);
    mat4.identity(this.bindPose);

    return this;
};
