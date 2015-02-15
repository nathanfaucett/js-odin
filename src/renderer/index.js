var Class = require("../class"),
    WebGLContext = require("webgl_context"),

    mat3 = require("mat3"),
    mat4 = require("mat4"),

    RendererGeometry = require("./renderer_geometry"),
    RendererMaterial = require("./renderer_material");


var ClassPrototype = Class.prototype;


module.exports = Renderer;


function Renderer() {

    Class.call(this);

    this.context = new WebGLContext();

    this.__renderers = {};
    this.__geometries = {};
    this.__materials = {};
    this.__texturess = {};
}
Class.extend(Renderer, "Renderer");

Renderer.prototype.construct = function() {

    ClassPrototype.construct.call(this);
    Renderer_createRenderers(this);

    return this;
};

Renderer.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.context.clearGL();
    this.__renderers = {};

    return this;
};

Renderer.prototype.addRenderer = function(type, fn, override) {
    var renderers = this.__renderers,
        renderer = renderers[type];

    if (renderer && !override) {
        throw new Error("renderer(type, fn[, override]) pass override=true to override renderers");
    }

    renderers[type] = fn;
    fn.type = type;
    fn.enabled = true;

    return this;
};

Renderer.prototype.removeRenderer = function(type) {
    var renderers = this.__renderers,
        renderer = renderers[type];

    if (renderer) {
        delete renderers[type];
    }

    return this;
};

Renderer.prototype.enableRenderer = function(type) {
    var renderers = this.__renderers,
        renderer = renderers[type];

    if (renderer) {
        renderer.enabled = true;
    }

    return this;
};

Renderer.prototype.disableRenderer = function(type) {
    var renderers = this.__renderers,
        renderer = renderers[type];

    if (renderer) {
        renderer.enabled = false;
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

function renderEach(component) {
    return renderEach.managerRenderer(
        renderEach.renderer,
        component,
        renderEach.camera,
        renderEach.scene,
        renderEach.manager
    );
}

renderEach.set = function(renderer, managerRenderer, camera, scene, manager) {
    renderEach.renderer = renderer;
    renderEach.managerRenderer = managerRenderer;
    renderEach.camera = camera;
    renderEach.scene = scene;
    renderEach.manager = manager;
    return renderEach;
};

Renderer.prototype.render = function(scene, camera) {
    var _this, context, renderers, renderer, managers, manager, i, il;

    _this = this;
    context = this.context;
    renderers = this.__renderers;
    managers = scene.__managers;

    context.setViewport(0, 0, camera.width, camera.height);
    context.setClearColor(camera.background, 1);
    context.clearCanvas();

    i = -1;
    il = managers.length - 1;

    while (i++ < il) {
        manager = managers[i];
        renderer = renderers[manager.componentName];

        if (renderer && renderer.enabled) {
            manager.forEach(renderEach.set(this, renderer, camera, scene, manager));
        }
    }

    return this;
};

var modelView = mat4.create(),
    normalMatrix = mat3.create();

function Renderer_createRenderers(_this) {
    var TransformString = "Transform";

    _this.addRenderer("Mesh", function renderMesh(renderer, mesh, camera) {
        var transform = mesh.sceneObject.getComponent(TransformString),

            meshMaterial = mesh.material,
            material = renderer.material(meshMaterial),
            geometry = renderer.geometry(mesh.geometry),

            program = material.getProgram(),

            context = renderer.context,
            gl = context.gl,

            indexBuffer;

        transform.calculateModelView(camera.view, modelView);
        transform.calculateNormalMatrix(modelView, normalMatrix);

        context.setProgram(material.program);

        bindUniforms(camera.projection, modelView, normalMatrix, program.uniforms, meshMaterial.uniforms);
        bindAttributes(program.attributes, geometry.getVertexBuffer(), geometry.buffers.__hash);

        if (meshMaterial.wireframe !== true) {
            indexBuffer = geometry.getIndexBuffer();
            context.setElementArrayBuffer(indexBuffer);
            gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
        } else {
            indexBuffer = geometry.getLineBuffer();
            context.setElementArrayBuffer(indexBuffer);
            gl.drawElements(gl.LINES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
        }
    });
}

function bindUniforms(projection, modelView, normalMatrix, glUniforms, uniforms) {
    var glHash = glUniforms.__hash,
        glArray = glUniforms.__array,
        i = -1,
        il = glArray.length - 1,
        glUniform, uniform;

    if (glHash.modelViewMatrix) {
        glHash.modelViewMatrix.set(modelView);
    }
    if (glHash.perspectiveMatrix) {
        glHash.perspectiveMatrix.set(projection);
    }
    if (glHash.normalMatrixMatrix) {
        glHash.normalMatrixMatrix.set(normalMatrix);
    }

    while (i++ < il) {
        glUniform = glArray[i];

        if ((uniform = uniforms[glUniform.name])) {
            glUniform.set(uniform);
        }
    }
}

function bindAttributes(glAttributes, vertexBuffer, buffers) {
    var glArray = glAttributes.__array,
        i = -1,
        il = glArray.length - 1,
        glAttribute, buffer;

    while (i++ < il) {
        glAttribute = glArray[i];
        buffer = buffers[glAttribute.name];
        glAttribute.set(vertexBuffer, buffer.offset);
    }
}
