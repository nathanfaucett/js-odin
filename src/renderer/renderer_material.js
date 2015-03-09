module.exports = RendererMaterial;


function RendererMaterial() {

    this.context = null;
    this.material = null;

    this.programs = null;

    this.needsCompile = null;
}

RendererMaterial.create = function(context, material) {
    return (new RendererMaterial()).construct(context, material);
};

RendererMaterial.prototype.construct = function(context, material) {

    this.context = context;
    this.material = material;

    this.programs = {};

    this.needsCompile = true;

    console.log(this);

    return this;
};

RendererMaterial.prototype.destructor = function() {

    this.context = null;
    this.material = null;

    this.programs = null;

    this.needsCompile = null;

    return this;
};

RendererMaterial.prototype.getProgramFor = function(data) {
    var program = this.programs[data.__id];

    if (program) {
        if (this.needsCompile === false) {
            return program;
        } else {
            program.needsCompile = true;
            return RendererMaterial_compile(this, data);
        }
    } else {
        return RendererMaterial_compile(this, data);
    }
};

function RendererMaterial_compile(_this, data) {
    var program = _this.programs[data.__id] || (_this.programs[data.__id] = _this.context.createProgram()),
        shader = _this.material.shader,

        options = RendererMaterial_getOptions(data),

        vertex = shader.vertex(options),
        fragment = shader.fragment(options);

    program.compile(vertex, fragment);
    _this.needsCompile = false;

    return program;
}


function RendererMaterial_getOptions(data) {
    var options = {};

    options.boneCount = data.bones ? data.bones.length : 0;
    options.boneWeightCount = data.boneWeightCount || 0;
    options.useBones = options.boneCount !== 0;

    return options;
}
