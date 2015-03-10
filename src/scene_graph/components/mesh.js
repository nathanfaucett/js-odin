var Component = require("./component"),
    Bone = require("./bone"),
    Transform = require("./transform"),
    SceneObject = require("../scene_object"),
    MeshManager = require("../component_managers/mesh_manager");


var ComponentPrototype = Component.prototype;


module.exports = Mesh;


function Mesh() {

    Component.call(this);

    this.geometry = null;
    this.material = null;
    this.bones = [];
}
Component.extend(Mesh, "Mesh", MeshManager);


Mesh.prototype.construct = function(geometry, material) {

    ComponentPrototype.construct.call(this);

    this.geometry = geometry;
    this.material = material;

    return this;
};

Mesh.prototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.geometry = null;
    this.material = null;
    this.bones.length = 0;

    return this;
};

Mesh.prototype.awake = function() {
    var geoBones = this.geometry.bones,
        i = -1,
        il = geoBones.length - 1,
        sceneObject, bones, geoBone, bone, transform, childSceneObject, parent;

    if (il !== -1) {
        sceneObject = this.sceneObject;
        bones = this.bones;

        while (i++ < il) {
            geoBone = geoBones[i];
            bone = Bone.create(geoBone);
            transform = Transform.create()
                .setPosition(geoBone.position)
                .setScale(geoBone.scale)
                .setRotation(geoBone.rotation);

            childSceneObject = SceneObject.create().addComponent(transform, bone);
            bones[bones.length] = childSceneObject;
            parent = bones[bone.parentIndex] || sceneObject;
            parent.add(childSceneObject);
        }
    }

    ComponentPrototype.awake.call(this);

    return this;
};

Mesh.prototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

Mesh.prototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};
