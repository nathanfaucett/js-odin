var vec2 = require("vec2"),
    enums = require("webgl_context").enums,
    ImageAsset = require("./image_asset");


var ImageAssetPrototype = ImageAsset.prototype,

    FilterMode = enums.FilterMode,
    TextureFormat = enums.TextureFormat,
    TextureWrap = enums.TextureWrap,
    TextureType = enums.TextureType;


module.exports = Texture;


function Texture() {

    ImageAsset.call(this);

    this.width = null;
    this.height = null;

    this.__invWidth = null;
    this.__invHeight = null;

    this.offset = vec2.create();
    this.repeat = vec2.create(1, 1);

    this.generateMipmap = null;
    this.flipY = null;
    this.premultiplyAlpha = null;

    this.anisotropy = null;

    this.filter = null;
    this.format = null;
    this.wrap = null;
    this.type = null;
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

    return this;
};

Texture.prototype.destructor = function() {

    ImageAssetPrototype.destructor.call(this);

    this.width = null;
    this.height = null;

    this.__invWidth = null;
    this.__invHeight = null;

    vec2.set(this.offset, 0, 0);
    vec2.set(this.repeat, 1, 1);

    this.generateMipmap = null;
    this.flipY = null;
    this.premultiplyAlpha = null;

    this.anisotropy = null;

    this.filter = null;
    this.format = null;
    this.wrap = null;
    this.type = null;

    return this;
};

Texture.prototype.parse = function() {
    var data = this.data;

    if (data != null) {
        this.setSize(data.width || 1, data.height || 1);
    }

    ImageAssetPrototype.parse.call(this);

    return this;
};

Texture.prototype.setSize = function(width, height) {

    this.width = width;
    this.height = height;

    this.__invWidth = 1 / this.width;
    this.__invHeight = 1 / this.height;

    this.emit("update");

    return this;
};

Texture.prototype.setOffset = function(x, y) {

    vec2.set(this.offset, x, y);
    this.emit("update");

    return this;
};

Texture.prototype.setRepeat = function(x, y) {

    vec2.set(this.repeat, x, y);
    this.emit("update");

    return this;
};

Texture.prototype.setMipmap = function(value) {

    this.generateMipmap = value != null ? !!value : this.generateMipmap;
    this.emit("update");

    return this;
};

Texture.prototype.setAnisotropy = function(value) {

    this.anisotropy = value;
    this.emit("update");

    return this;
};

Texture.prototype.setFilter = function(value) {

    this.filter = value;
    this.emit("update");

    return this;
};

Texture.prototype.setFormat = function(value) {

    this.format = value;
    this.emit("update");

    return this;
};

Texture.prototype.setWrap = function(value) {

    this.wrap = value;
    this.emit("update");

    return this;
};

Texture.prototype.setType = function(value) {

    this.type = value;
    this.emit("update");

    return this;
};
