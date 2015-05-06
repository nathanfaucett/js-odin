var Class = require("../class");


var ComponentRendererPrototype;


module.exports = ComponentRenderer;


function renderEach(component) {
    return renderEach.render(
        component,
        renderEach.camera,
        renderEach.scene,
        renderEach.manager
    );
}

renderEach.set = function(render, camera, scene, manager) {
    renderEach.render = render;
    renderEach.camera = camera;
    renderEach.scene = scene;
    renderEach.manager = manager;
    return renderEach;
};


function ComponentRenderer() {
    var _this = this;

    Class.call(this);

    this.renderer = null;
    this.enabled = true;

    this.__render = function(component, camera, scene, manager) {
        _this.render(component, camera, scene, manager);
    };
}

ComponentRenderer.onExtend = function(child, className, componentName, order) {
    child.componentName = child.prototype.componentName = componentName;
    child.order = child.prototype.order = order || 0;
};

Class.extend(ComponentRenderer, "ComponentRenderer");
ComponentRendererPrototype = ComponentRenderer.prototype;

ComponentRenderer.order = ComponentRendererPrototype.order = 0;

ComponentRendererPrototype.construct = function(renderer) {
    this.renderer = renderer;
    return this;
};

ComponentRendererPrototype.destructor = function() {
    this.renderer = null;
    return this;
};

ComponentRendererPrototype.bindRender = function(camera, scene, manager) {
    return renderEach.set(this.__render, camera, scene, manager);
};

ComponentRendererPrototype.enable = function() {
    this.enabled = true;
    return this;
};

ComponentRendererPrototype.disable = function() {
    this.enabled = false;
    return this;
};

ComponentRendererPrototype.init = function() {};

ComponentRendererPrototype.clear = function() {};

ComponentRendererPrototype.beforeRender = function( /* camera, scene, manager */ ) {};

ComponentRendererPrototype.afterRender = function( /* camera, scene, manager */ ) {};

ComponentRendererPrototype.render = function( /* component, camera, scene, manager */ ) {};
