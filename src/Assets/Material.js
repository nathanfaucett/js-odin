var JSONAsset = require("./JSONAsset"),
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

    this.side = options.side != null ? options.side : enums.side.FRONT;
    this.blending = options.blending != null ? options.blending : enums.blending.DEFAULT;

    this.wireframe = options.wireframe != null ? !!options.wireframe : false;
    this.wireframeLineWidth = options.wireframeLineWidth != null ? options.wireframeLineWidth : 1;

    this.receiveShadow = options.receiveShadow != null ? !!options.receiveShadow : true;
    this.castShadow = options.castShadow != null ? !!options.castShadow : true;

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
