var isArray = require("is_array"),
    isString = require("is_string");


module.exports = ShaderChunk;


function ShaderChunk() {
    this.code = null;
    this.template = null;
    this.requires = null;
    this.extensions = null;
}

ShaderChunk.create = function(options) {
    return (new ShaderChunk()).construct(options);
};

ShaderChunk.prototype.construct = function(options) {

    options = options || {};

    this.code = options.code;
    this.template = options.template;
    this.requires = isArray(options.requires) ? options.requires : [];
    this.extensions = isArray(options.extensions) ? options.extensions : [];

    return this;
};

ShaderChunk.prototype.destructor = function() {

    this.code = null;
    this.template = null;
    this.requires = null;
    this.extensions = null;

    return this;
};
