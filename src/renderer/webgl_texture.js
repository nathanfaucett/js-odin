var isArray = require("is_array"),
    TextureType = require("../enums/texture_type"),
    FilterMode = require("../enums/filter_mode");


module.exports = WebGLTexture;


function WebGLTexture() {
    this.destructor();
}

WebGLTexture.create = function(renderer, texture) {
    return (new WebGLTexture()).construct(renderer, texture);
};

WebGLTexture.prototype.construct = function(renderer, texture) {

    this.renderer = renderer;
    this.texture = texture;

    return this;
};

WebGLTexture.prototype.destructor = function() {

    this.renderer = null;
    this.texture = null;
    this.__webgl = null;

    return this;
};

WebGLTexture.prototype.compile = function() {
    var webgl = this.__webgl;

    if (this.texture.needsUpdate === false && webgl) {
        return webgl;
    }

    return WebGLTexture_compile(this);
};

function WebGLTexture_compile(_this) {
    var renderer = _this.renderer,
        gl = renderer.gl,
        texture = _this.texture,

        webgl = _this.__webgl || (_this.__webgl = gl.createTexture()),

        image = texture.data,
        notNull = image != null,
        isCubeMap = isArray(image),

        width = texture.width,
        height = texture.height,
        isPOT = mathf.isPowerOfTwo(width) && mathf.isPowerOfTwo(height),

        generateMipmap = texture.generateMipmap,
        flipY = texture.flipY,
        premultiplyAlpha = texture.premultiplyAlpha,
        anisotropy = texture.anisotropy,
        filter = texture.filter,
        format = texture.format,
        wrap = isPOT ? texture.wrap : gl.CLAMP_TO_EDGE,
        textureType = texture.type,

        TFA = (anisotropy > 0) && renderer.getExtension("EXT_texture_filter_anisotropic"),
        TEXTURE_TYPE = isCubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,
        minFilter, magFilter, images, i, il;

    if (TFA) {
        anisotropy = clamp(anisotropy, 1, renderer.__maxAnisotropy);
    }

    if (notNull) {
        if (isCubeMap) {
            images = [];
            i = -1;
            il = image.length - 1;

            while (i++ < il) {
                images[i] = renderer.clampMaxSize(image[i], isCubeMap);
            }
        } else {
            image = renderer.clampMaxSize(image, false);
        }
    }

    if (filter === FilterMode.None) {
        magFilter = gl.NEAREST;
        minFilter = isPOT && generateMipmap ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST;
    } else { //FilterMode.Linear
        magFilter = gl.LINEAR;
        minFilter = isPOT && generateMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
    }

    if (
        (textureType === TextureType.Float && !renderer.getExtension("OES_texture_float")) ||
        (textureType === TextureType.DepthComponent && !renderer.getExtension("WEBGL_depth_texture"))
    ) {
        textureType = gl.UNSIGNED_BYTE;
    }

    gl.bindTexture(TEXTURE_TYPE, webgl);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha ? 1 : 0);

    if (notNull) {
        if (isCubeMap) {
            i = images.length;
            while (i--) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, format, textureType, images[i]);
            }
        } else {
            gl.texImage2D(TEXTURE_TYPE, 0, format, format, textureType, image);
        }
    } else {
        if (isCubeMap) {
            i = image.length;
            while (i--) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, width, height, 0, format, textureType, null);
            }
        } else {
            if (textureType === TextureType.DepthComponent) {
                gl.texImage2D(TEXTURE_TYPE, 0, textureType, width, height, 0, textureType, gl.UNSIGNED_SHORT, null);
            } else {
                gl.texImage2D(TEXTURE_TYPE, 0, format, width, height, 0, format, textureType, null);
            }
        }
    }

    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_MIN_FILTER, minFilter);

    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(TEXTURE_TYPE, gl.TEXTURE_WRAP_T, wrap);

    if (TFA) {
        gl.texParameterf(TEXTURE_TYPE, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
    }
    if (generateMipmap && isPOT) {
        gl.generateMipmap(TEXTURE_TYPE);
    }

    gl.bindTexture(TEXTURE_TYPE, null);
    texture.needsUpdate = false;

    return webgl;
}
