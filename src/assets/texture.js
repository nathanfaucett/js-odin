var FilterMode = require("../enums/filter_mode"),
    TextureFormat = require("../enums/texture_format"),
    TextureWrap = require("../enums/texture_wrap"),
    TextureType = require("../enums/texture_type"),
    ImageAsset = require("./image_asset");


var ImageAssetPrototype = ImageAsset.prototype;


module.exports = Texture;


function Texture() {
    ImageAsset.call(this);
}
ImageAsset.extend(Texture, "Texture");

Texture.prototype.construct = function(name, src, options) {

    ImageAssetPrototype.construct.call(this, name, src);

    options = options || {};

    this.generateMipmap = options.generateMipmap != null ? !!options.generateMipmap : true;
    this.flipY = options.flipY != null ? !!options.flipY : true;
    this.premultiplyAlpha = options.premultiplyAlpha != null ? !!options.premultiplyAlpha : false;

    this.anisotropy = options.anisotropy != null ? options.anisotropy : 1;

    this.filter = options.filter != null ? options.filter : FilterMode.Linear;
    this.format = options.format != null ? options.format : TextureFormat.RGBA;
    this.wrap = options.wrap != null ? options.wrap : TextureWrap.Repeat;
    this.type = options.type != null ? options.type : TextureType.UnsignedByte;

    this.needsUpdate = true;

    return this;
};

Texture.prototype.destructor = function() {

    ImageAssetPrototype.destructor.call(this);

    this.width = null;
    this.height = null;

    this.invWidth = null;
    this.invHeight = null;

    this.generateMipmap = null;
    this.flipY = null;
    this.premultiplyAlpha = null;

    this.anisotropy = null;

    this.filter = null;
    this.format = null;
    this.wrap = null;
    this.type = null;

    this.needsUpdate = null;

    return this;
};

Texture.prototype.parse = function() {
    var data = this.data;

    this.width = data.width || 1;
    this.height = data.height || 1;

    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.needsUpdate = true;

    return this;
};

Texture.prototype.setMipmap = function(value) {

    this.generateMipmap = value != null ? !!value : this.generateMipmap;
    this.needsUpdate = true;
    return this;
};

Texture.prototype.setAnisotropy = function(value) {

    this.anisotropy = value;
    this.needsUpdate = true;
    return this;
};

Texture.prototype.setFilter = function(value) {

    this.filter = value;
    this.needsUpdate = true;
    return this;
};

Texture.prototype.setFormat = function(value) {

    this.format = value;
    this.needsUpdate = true;
    return this;
};

Texture.prototype.setWrap = function(value) {

    this.wrap = value;
    this.needsUpdate = true;
    return this;
};

Texture.prototype.setType = function(value) {

    this.type = value;
    this.needsUpdate = true;
    return this;
};
