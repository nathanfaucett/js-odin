var Component = require("./component"),
    MeshManager = require("../component_managers/mesh_manager");


var ComponentPrototype = Component.prototype;


module.exports = Mesh;


function Mesh() {
    Component.call(this);
}
Component.extend(Mesh, "Mesh", MeshManager);


Mesh.prototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.geometries = [];
    this.materials = [];

    return this;
};

Mesh.prototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.geometries = null;
    this.materials = null;

    return this;
};

Mesh.prototype.update = function(force) {

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
