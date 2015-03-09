var JSONAsset = require("./json_asset"),
    Shader = require("../shader/shader");


var JSONAssetPrototype = JSONAsset.prototype;


module.exports = Material;


function Material() {

    JSONAsset.call(this);

    this.shader = null;
    this.uniforms = null;
}
JSONAsset.extend(Material, "Material");

Material.prototype.construct = function(name, src, options) {

    JSONAssetPrototype.construct.call(this, name, src);

    options = options || {};

    if (options.shader) {
        this.shader = options.shader;
    } else {
        if (options.vertex && options.fragment) {
            this.shader = Shader.create(options.vertex, options.fragment);
        }
    }

    this.uniforms = options.uniforms || {};

    return this;
};

Material.prototype.destructor = function() {

    JSONAssetPrototype.destructor.call(this);

    this.uniforms = null;

    return this;
};

Material.prototype.parse = function() {
    JSONAssetPrototype.parse.call(this);
    return this;
};
