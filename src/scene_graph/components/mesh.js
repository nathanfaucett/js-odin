var Component = require("./component"),
    MeshManager = require("../component_managers/mesh_manager");


var ComponentPrototype = Component.prototype;


module.exports = Mesh;


function Mesh() {

    Component.call(this);

    this.geometry = null;
    this.material = null;
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

    return this;
};

Mesh.prototype.update = function() {

    ComponentPrototype.update.call(this);

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
