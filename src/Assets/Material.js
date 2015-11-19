var isNullOrUndefined = require("is_null_or_undefined"),
    JSONAsset = require("./JSONAsset"),
    Shader = require("../Shader"),
    enums = require("../enums");


var JSONAssetPrototype = JSONAsset.prototype,
    MaterialPrototype;


module.exports = Material;


function Material() {

    JSONAsset.call(this);

    this.shader = null;

    this.side = null;
    this.blending = null;

    this.wireframe = null;
    this.wireframeLineWidth = null;

    this.receiveShadow = null;
    this.castShadow = null;

    this.uniforms = null;
}
JSONAsset.extend(Material, "odin.Material");
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

    this.side = isNullOrUndefined(options.side) ? enums.side.FRONT : options.side;
    this.blending = isNullOrUndefined(options.blending) ? enums.blending.DEFAULT : options.blending;

    this.wireframe = isNullOrUndefined(options.wireframe) ? false : !!options.wireframe;
    this.wireframeLineWidth = isNullOrUndefined(options.wireframeLineWidth) ? 1 : options.wireframeLineWidth;

    this.receiveShadow = isNullOrUndefined(options.receiveShadow) ? true : !!options.receiveShadow;
    this.castShadow = isNullOrUndefined(options.castShadow) ? true : !!options.castShadow;

    return this;
};

MaterialPrototype.destructor = function() {

    JSONAssetPrototype.destructor.call(this);

    this.side = null;
    this.blending = null;

    this.wireframe = null;
    this.wireframeLineWidth = null;

    this.receiveShadow = null;
    this.castShadow = null;

    this.uniforms = null;

    return this;
};

MaterialPrototype.parse = function() {
    JSONAssetPrototype.parse.call(this);
    return this;
};
