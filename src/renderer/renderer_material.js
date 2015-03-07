module.exports = RendererMaterial;


function RendererMaterial() {
    this.context = null;
    this.material = null;

    this.parameters = null;
    this.program = null;
}

RendererMaterial.create = function(context, material) {
    return (new RendererMaterial()).construct(context, material);
};

RendererMaterial.prototype.construct = function(context, material) {

    this.context = context;
    this.material = material;

    this.parameters = {};

    return this;
};

RendererMaterial.prototype.destructor = function() {

    this.context = null;
    this.material = null;

    this.parameters = null;
    this.program = null;

    return this;
};

RendererMaterial.prototype.getProgram = function() {
    var program = this.program || (this.program = this.context.createProgram()),
        material;

    if (program.needsCompile) {
        material = this.material;
        program.compile(material.vertex, material.fragment);
    }

    return program;
};
