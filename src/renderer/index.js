var indexOf = require("index_of"),
    Class = require("../class"),
    WebGLContext = require("webgl_context"),

    vec3 = require("vec3"),
    quat = require("quat"),
    mat4 = require("mat4"),

    MeshRenderer = require("./mesh_renderer"),

    RendererGeometry = require("./renderer_geometry"),
    RendererMaterial = require("./renderer_material");


var ClassPrototype = Class.prototype;


module.exports = Renderer;


function Renderer() {

    Class.call(this);

    this.context = new WebGLContext();

    this.__rendererArray = [];
    this.renderers = {};

    this.__geometries = {};
    this.__materials = {};
}
Class.extend(Renderer, "Renderer");

Renderer.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    this.addRenderer(MeshRenderer.create(this));

    return this;
};

Renderer.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.context.clearGL();
    this.renderers = {};
    this.__rendererArray.length = 0;

    return this;
};

Renderer.prototype.addRenderer = function(renderer, override) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        index = rendererHash[renderer.componentName];

    if (index && !override) {
        throw new Error("Renderer.addRenderer(renderer, [, override]) pass override=true to override renderers");
    }
    renderers[renderers.length] = rendererHash[renderer.componentName] = renderer;

    return this;
};

Renderer.prototype.removeRenderer = function(componentName) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        renderer = rendererHash[componentName];

    if (renderer) {
        renderers.splice(indexOf(renderers, renderer), 1);
        delete rendererHash[componentName];
    }

    return this;
};

Renderer.prototype.setCanvas = function(canvas, attributes) {
    this.context.setCanvas(canvas, attributes);
    return this;
};

Renderer.prototype.geometry = function(geometry) {
    var geometries = this.__geometries;
    return geometries[geometry.__id] || (geometries[geometry.__id] = RendererGeometry.create(this.context, geometry));
};

Renderer.prototype.material = function(material) {
    var materials = this.__materials;
    return materials[material.__id] || (materials[material.__id] = RendererMaterial.create(this.context, material));
};

var bindUniforms_mat = mat4.create(),
    bindUniforms_position = vec3.create(),
    bindUniforms_scale = vec3.create(),
    bindUniforms_rotation = quat.create();

function bindBones(bones, length, glHash) {
    var bonePosition = glHash.bonePosition,
        boneScale = glHash.boneScale,
        boneRotation = glHash.boneRotation,
        bonePositionValue, boneScaleValue, boneRotationValue, mat,
        position, scale, rotation, i, il, index3, index4, bone;


    if (bonePosition && boneScale && boneRotation) {
        bonePositionValue = bonePosition.value;
        boneScaleValue = boneScale.value;
        boneRotationValue = boneRotation.value,

            mat = bindUniforms_mat;
        position = bindUniforms_position;
        scale = bindUniforms_scale;
        rotation = bindUniforms_rotation;

        i = -1;
        il = length - 1;
        index3 = 0;
        index4 = 0;

        while (i++ < il) {
            bone = bones[i].components.Bone;
            mat4.mul(mat, bone.uniform, bone.bindPose);
            mat4.decompose(mat, position, scale, rotation);

            bonePositionValue[index3] = position[0];
            bonePositionValue[index3 + 1] = position[1];
            bonePositionValue[index3 + 2] = position[2];

            boneScaleValue[index3] = scale[0];
            boneScaleValue[index3 + 1] = scale[1];
            boneScaleValue[index3 + 2] = scale[2];

            boneRotationValue[index4] = rotation[0];
            boneRotationValue[index4 + 1] = rotation[1];
            boneRotationValue[index4 + 2] = rotation[2];
            boneRotationValue[index4 + 3] = rotation[3];

            index3 += 3;
            index4 += 4;
        }

        bonePosition.set(bonePositionValue);
        boneScale.set(boneScaleValue);
        boneRotation.set(boneRotationValue);
    }
}

Renderer.prototype.bindUniforms = function(projection, modelView, normalMatrix, uniforms, bones, glUniforms) {
    var glHash = glUniforms.__hash,
        glArray = glUniforms.__array,
        glUniform, uniform, length, i, il;

    if (glHash.modelViewMatrix) {
        glHash.modelViewMatrix.set(modelView);
    }
    if (glHash.perspectiveMatrix) {
        glHash.perspectiveMatrix.set(projection);
    }
    if (glHash.normalMatrix) {
        glHash.normalMatrix.set(normalMatrix);
    }

    if (bones && (length = bones.length) !== 0) {
        bindBones(bones, length, glHash);
    }

    i = -1;
    il = glArray.length - 1;

    while (i++ < il) {
        glUniform = glArray[i];

        if ((uniform = uniforms[glUniform.name])) {
            glUniform.set(uniform);
        }
    }

    return this;
};

Renderer.prototype.bindAttributes = function(buffers, vertexBuffer, glAttributes) {
    var glArray = glAttributes.__array,
        i = -1,
        il = glArray.length - 1,
        glAttribute, buffer;

    while (i++ < il) {
        glAttribute = glArray[i];
        buffer = buffers[glAttribute.name];
        glAttribute.set(vertexBuffer, buffer.offset);
    }

    return this;
};

Renderer.prototype.render = function(scene, camera) {
    var _this, context, renderers, renderer, managerHash, manager, i, il;

    _this = this;
    context = this.context;
    renderers = this.__rendererArray;
    managerHash = scene.managers;

    context.setViewport(0, 0, camera.width, camera.height);
    context.setClearColor(camera.background, 1);
    context.clearCanvas();

    i = -1;
    il = renderers.length - 1;

    while (i++ < il) {
        renderer = renderers[i];
        manager = managerHash[renderer.componentName];

        if (manager !== undefined && renderer.enabled) {
            renderer.beforeRender(camera, scene, manager);
            manager.forEach(renderer.bindRender(camera, scene, manager));
            renderer.afterRender(camera, scene, manager);
        }
    }

    return this;
};
