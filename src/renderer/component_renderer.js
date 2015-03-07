var Class = require("../class");


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

ComponentRenderer.onExtend = function(child, className, componentName) {
    child.componentName = child.prototype.componentName = componentName;
};

Class.extend(ComponentRenderer);

ComponentRenderer.prototype.construct = function(renderer) {
    this.renderer = renderer;
    return this;
};

ComponentRenderer.prototype.destructor = function() {
    this.renderer = null;
    return this;
};

ComponentRenderer.prototype.bindRender = function(camera, scene, manager) {
    return renderEach.set(this.__render, camera, scene, manager);
};

ComponentRenderer.prototype.enable = function() {
    this.enabled = true;
    return this;
};

ComponentRenderer.prototype.disable = function() {
    this.enabled = false;
    return this;
};

ComponentRenderer.prototype.beforeRender = function( /* camera, scene, manager */ ) {};

ComponentRenderer.prototype.afterRender = function( /* camera, scene, manager */ ) {};

ComponentRenderer.prototype.render = function( /* component, camera, scene, manager */ ) {};
