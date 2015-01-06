var Component = require("./component"),
    TransformManager = require("../component_managers/transform_manager"),
    vec3 = require("vec3"),
    quat = require("quat"),
    mat3 = require("mat3"),
    mat4 = require("mat4");


var ComponentPrototype = Component.prototype;


module.exports = Transform;


function Transform() {

    Component.call(this);
}
Component.extend(Transform, "Transform", TransformManager);


Transform.prototype.construct = function() {

    ComponentPrototype.construct.call(this);

    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = vec3.create(1, 1, 1);

    this.matrix = mat4.create();
    this.matrixWorld = mat4.create();

    this.modelView = mat4.create();
    this.normalMatrix = mat3.create();

    return this;
};

Transform.prototype.destruct = function() {

    ComponentPrototype.destruct.call(this);

    this.position = null;
    this.rotation = null;
    this.scale = null;

    this.matrix = null;
    this.matrixWorld = null;

    this.modelView = null;
    this.normalMatrix = null;

    return this;
};

Transform.prototype.init = function() {

    ComponentPrototype.init.call(this);

    return this;
};

Transform.prototype.awake = function() {

    ComponentPrototype.awake.call(this);
    return this;
};

Transform.prototype.update = function() {
    var matrix = this.matrix,
        sceneObject = this.sceneObject,
        parent = sceneObject && sceneObject.parent,
        parentTransform = parent && parent.getComponent("Transform");

    ComponentPrototype.update.call(this);

    mat4.compose(matrix, this.position, this.scale, this.rotation);

    if (parentTransform) {
        mat4.mul(this.matrixWorld, parentTransform.matrixWorld, matrix);
    } else {
        mat4.copy(this.matrixWorld, matrix);
    }

    return this;
};

Transform.prototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.position = vec3.copy(json.position || [], this.position);
    json.rotation = quat.copy(json.rotation || [], this.rotation);
    json.scale = vec3.copy(json.scale || [], this.scale);

    return json;
};

Transform.prototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    vec3.copy(this.position, json.position);
    quat.copy(this.rotation, json.rotation);
    vec3.copy(this.scale, json.scale);

    return this;
};
