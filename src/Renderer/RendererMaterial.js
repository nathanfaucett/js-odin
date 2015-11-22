var RendererMaterialPrototype;


module.exports = RendererMaterial;


function RendererMaterial() {
    this.renderer = null;
    this.context = null;
    this.material = null;
}
RendererMaterialPrototype = RendererMaterial.prototype;

RendererMaterial.create = function(renderer, context, material) {
    return (new RendererMaterial()).construct(renderer, context, material);
};

RendererMaterialPrototype.construct = function(renderer, context, material) {

    this.renderer = renderer;
    this.context = context;
    this.material = material;

    return this;
};

RendererMaterialPrototype.destructor = function() {

    this.renderer = null;
    this.context = null;
    this.material = null;

    return this;
};

RendererMaterialPrototype.getProgramFor = function(data) {
    var programData = this.renderer.__programHash[data.__id],
        program;

    if (programData) {
        program = programData.program;

        if (program.needsCompile === false) {
            return program;
        } else {
            return this.renderer.createProgram(this.material.shader, data, force);
        }
    } else {
        return this.renderer.createProgram(this.material.shader, data);
    }
};
