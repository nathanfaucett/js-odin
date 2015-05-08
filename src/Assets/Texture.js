var vec2 = require("vec2"),
    WebGLContext = require("webgl_context"),
    ImageAsset = require("./ImageAsset");


var ImageAssetPrototype = ImageAsset.prototype,

    enums = WebGLContext.enums,
    FilterMode = enums.FilterMode,
    TextureFormat = enums.TextureFormat,
    TextureWrap = enums.TextureWrap,
    TextureType = enums.TextureType,

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
ImageAsset.extend(Texture, "Texture");
TexturePrototype = Texture.prototype;

TexturePrototype.construct = function(name, src, options) {

    ImageAssetPrototype.construct.call(this, name, src);

    options = options || {};

    this.generateMipmap = options.generateMipmap != null ? !!options.generateMipmap : true;
    this.flipY = options.flipY != null ? !!options.flipY : false;
    this.premultiplyAlpha = options.premultiplyAlpha != null ? !!options.premultiplyAlpha : false;

    this.anisotropy = options.anisotropy != null ? options.anisotropy : 1;

    this.filter = options.filter != null ? options.filter : FilterMode.Linear;
    this.format = options.format != null ? options.format : TextureFormat.RGBA;
    this.wrap = options.wrap != null ? options.wrap : TextureWrap.Repeat;
    this.type = options.type != null ? options.type : TextureType.UnsignedByte;

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

    if (data != null) {
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

    this.generateMipmap = value != null ? !!value : this.generateMipmap;
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
