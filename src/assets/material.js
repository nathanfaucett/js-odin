var JSONAsset = require("./json_asset");


var JSONAssetPrototype = JSONAsset.prototype;


module.exports = Material;


function Material() {

    JSONAsset.call(this);

    this.uniforms = null;
}
JSONAsset.extend(Material, "Material");

Material.prototype.construct = function(name, src, options) {

    JSONAssetPrototype.construct.call(this, name, src);

    options = options || {};

    this.vertex = options.vertex;
    this.fragment = options.fragment;

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
