var Component = require("./index"),
    Bone = require("./Bone"),
    Transform = require("./Transform"),
    Entity = require("../Entity"),
    MeshManager = require("../ComponentManager/MeshManager");


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
