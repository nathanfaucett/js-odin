var indexOf = require("index_of"),
    WebGLContext = require("webgl_context"),
    mat4 = require("mat4"),

    Class = require("class"),
    side = require("../enums/side"),

    MeshRenderer = require("./MeshRenderer"),
    SpriteRenderer = require("./SpriteRenderer"),

    RendererGeometry = require("./RendererGeometry"),
    RendererMaterial = require("./RendererMaterial");


var enums = WebGLContext.enums,
    ClassPrototype = Class.prototype,
    RendererPrototype;


module.exports = Renderer;


function Renderer() {
    var _this = this;

    Class.call(this);

    this.context = new WebGLContext();

    this.__rendererArray = [];
    this.renderers = {};

    this.__geometries = {};
    this.__materials = {};

    this.__programHash = {};
    this.__programs = [];

    this.onContextCreation = function() {
        _this.__onContextCreation();
    };
    this.onContextDestroy = function() {
        _this.__onContextDestroy();
    };
}
Class.extend(Renderer, "odin.Renderer");
RendererPrototype = Renderer.prototype;

RendererPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    this.addRenderer(MeshRenderer.create(this), false, false);
    this.addRenderer(SpriteRenderer.create(this), false, false);
    this.sortRenderers();

    return this;
};

RendererPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.context.clearGL();
    this.renderers = {};
    this.__rendererArray.length = 0;

    return this;
};

RendererPrototype.__onContextCreation = function() {
    var renderers = this.__rendererArray,
        i = -1,
        il = renderers.length - 1;

    while (i++ < il) {
        renderers[i].init();
    }

    return this;
};

RendererPrototype.__onContextDestroy = function() {
    var renderers = this.__rendererArray,
        i = -1,
        il = renderers.length - 1;

    while (i++ < il) {
        renderers[i].clear();
    }

    return this;
};

RendererPrototype.addRenderer = function(renderer, override, sort) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        index = rendererHash[renderer.componentName];

    if (index && !override) {
        throw new Error("Renderer.addRenderer(renderer, [, override]) pass override=true to override renderers");
    }
    renderers[renderers.length] = rendererHash[renderer.componentName] = renderer;

    if (sort !== false) {
        this.sortRenderers();
    }

    return this;
};

RendererPrototype.removeRenderer = function(componentName) {
    var renderers = this.__rendererArray,
        rendererHash = this.renderers,
        renderer = rendererHash[componentName];

    if (renderer) {
        renderers.splice(indexOf(renderers, renderer), 1);
        delete rendererHash[componentName];
    }

    return this;
};

RendererPrototype.sortRenderers = function() {
    this.__rendererArray.sort(sortRenderers);
    return this;
};

function sortRenderers(a, b) {
    return a.order - b.order;
}

RendererPrototype.setCanvas = function(canvas, attributes) {
    var context = this.context;

    if (canvas && context.canvas !== canvas) {
        context.off("webglcontextcreation", this.onContextCreation);
        context.off("webglcontextrestored", this.onContextCreation);
        context.off("webglcontextcreationfailed", this.onContextDestroy);
        context.off("webglcontextlost", this.onContextDestroy);
    }

    context.on("webglcontextcreation", this.onContextCreation);
    context.on("webglcontextrestored", this.onContextCreation);
    context.on("webglcontextcreationfailed", this.onContextDestroy);
    context.on("webglcontextlost", this.onContextDestroy);

    context.setCanvas(canvas, attributes);

    return this;
};

RendererPrototype.geometry = function(geometry) {
    var geometries = this.__geometries;
    return geometries[geometry.__id] || (geometries[geometry.__id] = RendererGeometry.create(this.context, geometry));
};

RendererPrototype.material = function(material) {
    var materials = this.__materials;
    return materials[material.__id] || (materials[material.__id] = RendererMaterial.create(this, this.context, material));
};

RendererPrototype.bindMaterial = function(material) {
    this.setSide(material.side);
    this.context.setBlending(material.blending);
    if (material.wireframe) {
        this.context.setLineWidth(material.wireframeLineWidth);
    }
};

RendererPrototype.setSide = function(value) {
    switch (value) {
        case side.FRONT:
            this.context.setCullFace(enums.cullFace.BACK);
            break;
        case side.BACK:
            this.context.setCullFace(enums.cullFace.FRONT);
            break;
        case side.NONE:
            this.context.setCullFace(enums.cullFace.FRONT_AND_BACK);
            break;
        default:
            this.context.setCullFace(enums.cullFace.NONE);
            break;
    }
    return this;
};

var bindBoneUniforms_mat = mat4.create();
RendererPrototype.bindBoneUniforms = function(bones, glUniforms) {
    var boneMatrix = glUniforms.__hash.boneMatrix,
        boneMatrixValue, mat, i, il, index, bone;

    if (boneMatrix) {
        boneMatrixValue = boneMatrix.value;

        mat = bindBoneUniforms_mat;

        i = -1;
        il = bones.length - 1;
        index = 0;

        while (i++ < il) {
            bone = bones[i].components["odin.Bone"];
            mat4.mul(mat, bone.uniform, bone.bindPose);

            boneMatrixValue[index] = mat[0];
            boneMatrixValue[index + 1] = mat[1];
            boneMatrixValue[index + 2] = mat[2];
            boneMatrixValue[index + 3] = mat[3];
            boneMatrixValue[index + 4] = mat[4];
            boneMatrixValue[index + 5] = mat[5];
            boneMatrixValue[index + 6] = mat[6];
            boneMatrixValue[index + 7] = mat[7];
            boneMatrixValue[index + 8] = mat[8];
            boneMatrixValue[index + 9] = mat[9];
            boneMatrixValue[index + 10] = mat[10];
            boneMatrixValue[index + 11] = mat[11];
            boneMatrixValue[index + 12] = mat[12];
            boneMatrixValue[index + 13] = mat[13];
            boneMatrixValue[index + 14] = mat[14];
            boneMatrixValue[index + 15] = mat[15];

            index += 16;
        }

        boneMatrix.set(boneMatrixValue);
    }
};

RendererPrototype.bindUniforms = function(projection, modelView, normalMatrix, uniforms, glUniforms) {
    var glHash = glUniforms.__hash,
        glArray = glUniforms.__array,
        glUniform, uniform, i, il;

    if (glHash.modelViewMatrix) {
        glHash.modelViewMatrix.set(modelView);
    }
    if (glHash.perspectiveMatrix) {
        glHash.perspectiveMatrix.set(projection);
    }
    if (glHash.normalMatrix) {
        glHash.normalMatrix.set(normalMatrix);
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

RendererPrototype.bindAttributes = function(buffers, vertexBuffer, glAttributes) {
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

RendererPrototype.render = function(scene, camera) {
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
