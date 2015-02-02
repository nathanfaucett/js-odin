var WeakMapShim = require("weak_map_shim"),
    WebGLRenderer = require("./webgl_renderer");


var WebGLRendererPrototype = Class.prototype;


module.exports = Renderer;


function Renderer() {
    WebGLRenderer.call(this);
}
WebGLRenderer.extend(Renderer, "Renderer");

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

Renderer.prototype.construct = function(options) {

    WebGLRendererPrototype.construct.call(this, options);

    Renderer_createRenderers(this);

    this.__scenes = new WeakMapShim();
    this.__renderers = extend({}, Renderer.__renderers);

    return this;
};

Renderer.prototype.destructor = function() {

    WebGLRendererPrototype.destructor.call(this);

    this.__scenes = null;
    this.__renderers = null;

    return this;
};

Renderer.prototype.render = function(scene, camera) {
    var _this, renderers, managers, scenes, internalScene, i, il;

    _this = this;

    managers = scene.__managers;
    renderers = this.__renderers;

    scenes = this.__scenes;
    internalScene = scenes.get(scene);

    if (!internalScene) {
        internalScene = {};
        scenes.set(scene, internalScene);
    } else {
        setSceneEvents(scene);
    }

    i = -1;
    il = manager.length - 1;

    while (i++ < il) {
        manager = managers[i];
        renderer = renderers[manager.className];

        if (renderer && renderer.enabled) {
            manager.forEach(function each(component) {
                return renderer(_this, component, camera, scene, manager);
            });
        }
    }

    return this;
};

function addSceneEvents(scene) {
    scene.once("destroy", function() {
        removeSceneEvents(scene);
    });
}

function removeSceneEvents(scene) {

}

function Renderer_createRenderers(_this) {
    _this.addRenderer("Mesh", function renderMesh(renderer, meshFilter, camera) {
        var materials = meshFilter.materials,
            geometries = meshFilter.geometries,
            i = -1,
            il = geometries.length - 1;

        while (i++ < il) {
            renderMeshGeometry(renderer, meshFilter, camera, geometries[i], materials);
        }
    });
}

function renderMeshGeometry(renderer, meshFilter, camera, geometry, materials) {

}
