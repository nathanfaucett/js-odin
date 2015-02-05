var Class = require("../base/class");


var ClassPrototype = Class.prototype;


module.exports = Renderer;


function Renderer() {
    Class.call(this);
}
Class.extend(Renderer, "Renderer");

Renderer.prototype.construct = function(scene) {

    ClassPrototype.construct.call(this);

    if (scene) {
        this.setScene(scene);
    }

    Renderer_createRenderers(this);

    this.__renderers = extend({}, Renderer.__renderers);

    return this;
};

Renderer.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.__scene = null;
    this.__renderers = null;

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

Renderer.prototype.render = function(camera) {
    var _this, renderers, scene, managers, i, il;

    _this = this;
    renderers = this.__renderers;
    scene = this.__scene;
    managers = scene.__managers;

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
