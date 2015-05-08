var JSONAsset = require("./JSONAsset"),
    Shader = require("../Shader");


var JSONAssetPrototype = JSONAsset.prototype,
    MaterialPrototype;


module.exports = Material;


function Material() {

    JSONAsset.call(this);

    this.shader = null;
    this.uniforms = null;
}
JSONAsset.extend(Material, "Material");
MaterialPrototype = Material.prototype;

MaterialPrototype.construct = function(name, src, options) {

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

MaterialPrototype.destructor = function() {

    JSONAssetPrototype.destructor.call(this);

    this.uniforms = null;

    return this;
};

MaterialPrototype.parse = function() {
    JSONAssetPrototype.parse.call(this);
    return this;
};
