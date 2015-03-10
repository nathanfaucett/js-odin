var map = require("map"),
    keys = require("keys"),
    template = require("template"),
    pushUnique = require("push_unique"),
    Class = require("../class"),
    chunks = require("./chunks");


var ClassPrototype = Class.prototype,

    VERTEX = "vertex",
    FRAGMENT = "fragment",

    chunkRegExps = map(keys(chunks), function(key) {
        return {
            key: key,
            regexp: new RegExp("\\b" + key + "\\b")
        };
    });


module.exports = Shader;


function Shader() {

    Class.call(this);

    this.vertex = null;
    this.fragment = null;
    this.templateVariables = [];
}
Class.extend(Shader, "Shader");

Shader.prototype.construct = function(vertex, fragment) {

    ClassPrototype.construct.call(this);

    if (vertex && fragment) {
        this.set(vertex, fragment);
    }

    return this;
};

Shader.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.vertex = null;
    this.fragment = null;
    this.templateVariables.length = 0;

    return this;
};

Shader.prototype.set = function(vertex, fragment) {

    this.templateVariables.length = 0;
    this.vertex = Shader_compile(this, vertex, VERTEX);
    this.fragment = Shader_compile(this, fragment, FRAGMENT);

    return this;
};

function Shader_compile(_this, shader, type) {
    var templateVariables = _this.templateVariables,
        shaderChunks = [],
        out = "",
        i = -1,
        il = chunkRegExps.length - 1,
        chunkRegExp;

    while (i++ < il) {
        chunkRegExp = chunkRegExps[i];

        if (chunkRegExp.regexp.test(shader)) {
            requireChunk(shaderChunks, templateVariables, chunks[chunkRegExp.key], type);
        }
    }

    i = -1;
    il = shaderChunks.length - 1;
    while (i++ < il) {
        out += shaderChunks[i].code;
    }

    return template(out + "\n" + shader);
}

function requireChunk(shaderChunks, templateVariables, chunk, type) {
    var requires, i, il;

    if (
        type === VERTEX && chunk.vertex ||
        type === FRAGMENT && chunk.fragment
    ) {
        requires = chunk.requires;
        i = -1;
        il = requires.length - 1;

        while (i++ < il) {
            requireChunk(shaderChunks, templateVariables, chunks[requires[i]], type);
        }

        pushUnique(shaderChunks, chunk);

        if (chunk.template) {
            pushUnique.array(templateVariables, chunk.template);
        }
    }
}
