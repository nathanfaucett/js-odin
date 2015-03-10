var has = require("has");


module.exports = RendererMaterial;


function RendererMaterial() {

    this.renderer = null;
    this.context = null;
    this.material = null;

    this.programs = {};

    this.needsCompile = null;
}

RendererMaterial.create = function(renderer, context, material) {
    return (new RendererMaterial()).construct(renderer, context, material);
};

RendererMaterial.prototype.construct = function(renderer, context, material) {

    this.renderer = renderer;
    this.context = context;
    this.material = material;

    return this;
};

RendererMaterial.prototype.destructor = function() {
    var programs = this.programs,
        id;

    this.renderer = null;
    this.context = null;
    this.material = null;

    for (id in programs) {
        if (has(programs, id)) {
            delete programs[id];
        }
    }

    this.programs = null;

    return this;
};

RendererMaterial.prototype.getProgramFor = function(data) {
    var programData = this.renderer.__programHash[data.__id],
        program;

    if (programData) {
        program = programData.program;

        if (program.needsCompile === false) {
            return program;
        } else {
            return RendererMaterial_compile(this, data);
        }
    } else {
        return RendererMaterial_compile(this, data);
    }
};

function ProgramData() {
    var _this = this;

    this.used = 1;
    this.program = null;
    this.vertex = null;
    this.fragment = null;

    this.onUpdate = function() {
        _this.program.needsUpdate = true;
    };
}

function RendererMaterial_compile(_this, data) {
    var id = data.__id,

        renderer = _this.renderer,

        programs = renderer.__programs,
        programHash = renderer.__programHash,

        programData = programHash[id],

        i = -1,
        il = programs.length - 1,
        program, shader, options, vertex, fragment;

    if (programData) {
        if (_this.programs[id] !== programData) {
            _this.programs[id] = programData;
            programData.used += 1;
            data.on("update", programData.onUpdate);
        }
        program = programData.program;
    } else {
        shader = _this.material.shader;
        options = RendererMaterial_getOptions(data);

        vertex = shader.vertex(options);
        fragment = shader.fragment(options);

        while (i++ < il) {
            program = programs[i];

            if (program.vertex === vertex && program.fragment === fragment) {
                programData = program;
                break;
            }
        }

        if (!programData) {
            programData = new ProgramData();
            program = programData.program = _this.context.createProgram();
        } else {
            programData.used += 1;
            program = programData.program;
        }

        programData.vertex = vertex;
        programData.fragment = fragment;

        program.compile(vertex, fragment);

        _this.programs[id] = programHash[id] = programs[programs.length] = programData;
        data.on("update", programData.onUpdate);
    }

    return program;
}

function RendererMaterial_getOptions(data) {
    var options = {};

    options.boneCount = data.bones ? data.bones.length : 0;
    options.boneWeightCount = data.boneWeightCount || 0;
    options.useBones = options.boneCount !== 0;

    return options;
}
