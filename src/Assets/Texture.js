var vec2 = require("vec2"),
    isNullOrUndefined = require("is_null_or_undefined"),
    WebGLContext = require("webgl_context"),
    ImageAsset = require("./ImageAsset");


var ImageAssetPrototype = ImageAsset.prototype,

    enums = WebGLContext.enums,
    filterMode = enums.filterMode,
    textureFormat = enums.textureFormat,
    textureWrap = enums.textureWrap,
    textureType = enums.textureType,

    TexturePrototype;


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
ImageAsset.extend(Texture, "odin.Texture");
TexturePrototype = Texture.prototype;

TexturePrototype.construct = function(options) {

    ImageAssetPrototype.construct.call(this, options);

    options = options || {};

    this.width = isNullOrUndefined(options.width) ? null : options.width;
    this.height = isNullOrUndefined(options.height) ? null : options.height;

    this.generateMipmap = isNullOrUndefined(options.generateMipmap) ? true : !!options.generateMipmap;
    this.flipY = isNullOrUndefined(options.flipY) ? false : !!options.flipY;
    this.premultiplyAlpha = isNullOrUndefined(options.premultiplyAlpha) ? false : !!options.premultiplyAlpha;

    this.anisotropy = isNullOrUndefined(options.anisotropy) ? 1 : options.anisotropy;

    this.filter = isNullOrUndefined(options.filter) ? filterMode.Linear : options.filter;
    this.format = isNullOrUndefined(options.format) ? textureFormat.RGBA : options.format;
    this.wrap = isNullOrUndefined(options.wrap) ? textureWrap.Repeat : options.wrap;
    this.type = isNullOrUndefined(options.type) ? textureType.UnsignedByte : options.type;

    return this;
};

TexturePrototype.destructor = function() {

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

TexturePrototype.parse = function() {
    var data = this.data;

    if (!isNullOrUndefined(data)) {
        this.setSize(data.width || 1, data.height || 1);
    }

    ImageAssetPrototype.parse.call(this);

    return this;
};

TexturePrototype.setSize = function(width, height) {

    this.width = width;
    this.height = height;

    this.__invWidth = 1 / this.width;
    this.__invHeight = 1 / this.height;

    this.emit("update");

    return this;
};

TexturePrototype.setOffset = function(x, y) {

    vec2.set(this.offset, x, y);
    this.emit("update");

    return this;
};

TexturePrototype.setRepeat = function(x, y) {

    vec2.set(this.repeat, x, y);
    this.emit("update");

    return this;
};

TexturePrototype.setMipmap = function(value) {

    this.generateMipmap = isNullOrUndefined(value) ? this.generateMipmap : !!value;
    this.emit("update");

    return this;
};

TexturePrototype.setAnisotropy = function(value) {

    this.anisotropy = value;
    this.emit("update");

    return this;
};

TexturePrototype.setFilter = function(value) {

    this.filter = value;
    this.emit("update");

    return this;
};

TexturePrototype.setFormat = function(value) {

    this.format = value;
    this.emit("update");

    return this;
};

TexturePrototype.setWrap = function(value) {

    this.wrap = value;
    this.emit("update");

    return this;
};

TexturePrototype.setType = function(value) {

    this.type = value;
    this.emit("update");

    return this;
};
