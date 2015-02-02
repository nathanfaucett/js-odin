var mathf = require("mathf"),

    environment = require("environment"),
    eventListener = require("event_listener"),
    color = require("color"),

    Class = require("../base/class"),
    CullFace = require("../enums/cull_face"),
    Blending = require("../enums/blending"),

    WebGLTexture = require("./webgl_texture");


var ClassPrototype = Class.prototype,
    NativeUint8Array = typeof(Uint8Array) !== "undefined" ? Uint8Array : Array;


module.exports = WebGLRenderer;


function WebGLRenderer() {
    Class.call(this);
}
Class.extend(WebGLRenderer, "WebGLRenderer");

WebGLRenderer.prototype.construct = function(options) {

    ClassPrototype.construct.call(this);

    options = options || {};

    this.__attributes = getAttributes(this, options);

    this.__textures = {};
    this.__shaders = {};
    this.__buffers = {};

    this.__extensions = {};

    this.__clearColor = color.create();

    return this;
};

WebGLRenderer.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.gl = null;
    this.element = null;

    this.__attributes = null;

    this.__textures = null;
    this.__shaders = null;
    this.__buffers = null;

    this.__precision = null;
    this.__extensions = null;

    this.__maxAnisotropy = null;
    this.__maxTextures = null;
    this.__maxVertexTextures = null;
    this.__maxTextureSize = null;
    this.__maxCubeTextureSize = null;
    this.__maxRenderBufferSize = null;

    this.__maxUniforms = null;
    this.__maxVaryings = null;
    this.__maxAttributes = null;

    this.__enabledAttributes = null;

    this.__viewportX = null;
    this.__viewportY = null;
    this.__viewportWidth = null;
    this.__viewportHeight = null;

    this.__clearColor = null;
    this.__clearAlpha = null;

    this.__blending = null;
    this.__blendingDisabled = null;
    this.__cullFace = null;
    this.__cullFaceDisabled = null;
    this.__depthTest = null;
    this.__depthWrite = null;
    this.__lineWidth = null;

    this.__program = null;
    this.__programForce = null;

    this.__textureIndex = null;
    this.__activeTexture = null;

    this.__handlerContextLost = null;
    this.__handlerContextRestored = null;

    return this;
};

WebGLRenderer.prototype.setElement = function(element) {
    var _this = this,
        thisElement = this.element;

    if (thisElement !== element && thisElement) {
        eventListener.off(thisElement, "webglcontextlost", this.__handlerContextLost);
        eventListener.off(thisElement, "webglcontextrestored", this.__handlerContextRestored);
    }

    this.element = element;

    this.__handlerContextLost = this.__handlerContextLost || function(e) {
        handleWebGLRendererContextLost(_this, e);
    };
    this.__handlerContextRestored = this.__handlerContextRestored || function(e) {
        handleWebGLRendererContextRestored(_this, e);
    };

    eventListener.on(element, "webglcontextlost", this.__handlerContextLost);
    eventListener.on(element, "webglcontextrestored", this.__handlerContextRestored);

    getGLContext(this);

    return this;
};

WebGLRenderer.prototype.resetGL = function() {

    this.__viewportX = null;
    this.__viewportY = null;
    this.__viewportWidth = null;
    this.__viewportHeight = null;

    color.set(this.__clearColor, -1, -1, -1);
    this.__clearAlpha = null;

    this.__blending = null;
    this.__blendingDisabled = null;
    this.__cullFace = null;
    this.__cullFaceDisabled = null;
    this.__depthTest = null;
    this.__depthWrite = null;
    this.__lineWidth = null;

    this.__program = null;
    this.__programForce = null;

    this.__textureIndex = null;
    this.__activeTexture = null;

    this.disableAttributes();
    this.setViewport(0, 0, 1, 1);
    this.setDepthTest(false);
    this.setDepthWrite(false);
    this.setLineWidth(1);
    this.setCullFace(CullFace.Back);
    this.setBlending(Blending.Default);
    this.setClearColor(color.set(this.__clearColor, 0, 0, 0), 1);
    this.setProgram(null);
    this.clearCanvas();

    return this;
};

WebGLRenderer.prototype.clampMaxSize = function(image, isCubeMap) {
    var maxSize = isCubeMap ? this.__maxCubeTextureSize : this.__maxTextureSize,
        maxDim, newWidth, newHeight, canvas, ctx;

    if (!image || (image.height <= maxSize && image.width <= maxSize)) {
        return image;
    }

    maxDim = 1 / mathf.max(image.width, image.height);
    newWidth = (image.width * maxSize * maxDim) | 0;
    newHeight = (image.height * maxSize * maxDim) | 0;
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight);

    return canvas;
};

WebGLRenderer.prototype.setViewport = function(x, y, width, height) {
    x = x || 0;
    y = y || 0;
    width = width || 1;
    height = height || 1;

    if (
        this.__viewportX !== x ||
        this.__viewportY !== y ||
        this.__viewportWidth !== width ||
        this.__viewportHeight !== height
    ) {
        this.__viewportX = x;
        this.__viewportY = y;
        this.__viewportWidth = width;
        this.__viewportHeight = height;

        this.gl.viewport(x, y, width, height);
    }

    return this;
};

WebGLRenderer.prototype.setDepthTest = function(depthTest) {
    var gl = this.gl;

    if (this.__depthTest !== depthTest) {

        if (depthTest) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        this.__depthTest = depthTest;
    }

    return this;
};

WebGLRenderer.prototype.setDepthWrite = function(depthWrite) {

    if (this.__depthWrite !== depthWrite) {

        this.gl.depthMask(depthWrite);
        this.__depthWrite = depthWrite;
    }

    return this;
};

WebGLRenderer.prototype.setLineWidth = function(width) {

    if (this.__lineWidth !== width) {

        this.gl.lineWidth(width);
        this.__lineWidth = width;
    }

    return this;
};

WebGLRenderer.prototype.setCullFace = function(cullFace) {
    var gl = this.gl;

    if (this.__cullFace !== cullFace) {
        if (cullFace === CullFace.Back) {
            if (this.__cullFaceDisabled) {
                gl.enable(gl.CULL_FACE);
            }
            gl.cullFace(gl.BACK);
        } else if (cullFace === CullFace.Front) {
            if (this.__cullFaceDisabled) {
                gl.enable(gl.CULL_FACE);
            }
            gl.cullFace(gl.FRONT);
        } else if (cullFace === CullFace.FrontBack) {
            if (this.__cullFaceDisabled) {
                gl.enable(gl.CULL_FACE);
            }
            gl.cullFace(gl.FRONT_AND_BACK);
        } else {
            this.__cullFaceDisabled = true;
            this.__cullFace = CullFace.None;
            gl.disable(gl.CULL_FACE);
            return this;
        }

        this.__cullFaceDisabled = false;
        this.__cullFace = cullFace;
    }

    return this;
};

WebGLRenderer.prototype.setBlending = function(blending) {
    var gl = this.gl;

    if (this.__blending !== blending) {
        if (blending === Blending.Additive) {
            if (this.__blendingDisabled) {
                gl.enable(gl.BLEND);
            }
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else if (blending === Blending.Subtractive) {
            if (this.__blendingDisabled) {
                gl.enable(gl.BLEND);
            }
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
        } else if (blending === Blending.Muliply) {
            if (this.__blendingDisabled) {
                gl.enable(gl.BLEND);
            }
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
        } else if (blending === Blending.Default) {
            if (this.__blendingDisabled) {
                gl.enable(gl.BLEND);
            }
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.disable(gl.BLEND);
            this.__blendingDisabled = true;
            this.__blending = Blending.None;
            return this;
        }

        this.__blendingDisabled = false;
        this.__blending = blending;
    }

    return this;
};

WebGLRenderer.prototype.setScissor = function(x, y, width, height) {

    this.gl.scissor(x, y, width, height);
    return this;
};

WebGLRenderer.prototype.setClearColor = function(clearColor, alpha) {
    alpha = alpha || 1;

    if (color.notEqual(this.__clearColor, clearColor) || alpha !== this.__clearAlpha) {

        color.copy(this.__clearColor, clearColor);
        this.__clearAlpha = alpha;

        this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], alpha);
    }

    return this;
};

WebGLRenderer.prototype.setProgram = function(program) {

    if (this.__program !== program) {
        this.__program = program;
        this.__programForce = true;

        this.gl.useProgram(program);
    } else {
        this.__programForce = false;
    }

    this.__textureIndex = 0;
    this.__activeTexture = -1;

    return this;
};

WebGLRenderer.prototype.clearCanvas = function(color, depth, stencil) {
    var gl = this.gl,
        bits = 0;

    if (color === undefined || color) {
        bits |= gl.COLOR_BUFFER_BIT;
    }
    if (depth === undefined || depth) {
        bits |= gl.DEPTH_BUFFER_BIT;
    }
    if (stencil === undefined || stencil) {
        bits |= gl.STENCIL_BUFFER_BIT;
    }

    gl.clear(bits);

    return this;
};

WebGLRenderer.prototype.clearColor = function() {
    var gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);
    return this;
};

WebGLRenderer.prototype.clearDepth = function() {
    var gl = this.gl;

    gl.clear(gl.DEPTH_BUFFER_BIT);
    return this;
};

WebGLRenderer.prototype.clearStencil = function() {
    var gl = this.gl;

    gl.clear(gl.STENCIL_BUFFER_BIT);
    return this;
};

WebGLRenderer.prototype.enableAttribute = function(attribute) {
    var enabledAttributes = this.__enabledAttributes;

    if (enabledAttributes[attribute] === 0) {
        this.gl.enableVertexAttribArray(attribute);
        enabledAttributes[attribute] = 1;
    }

    return this;
};

WebGLRenderer.prototype.disableAttribute = function(attribute) {
    var enabledAttributes = this.__enabledAttributes;

    if (enabledAttributes[attribute] === 1) {
        this.gl.disableVertexAttribArray(attribute);
        enabledAttributes[attribute] = 0;
    }

    return this;
};

WebGLRenderer.prototype.disableAttributes = function() {
    var gl = this.gl,
        i = this.__maxAttributes,
        enabledAttributes = this.__enabledAttributes;

    while (i--) {
        if (enabledAttributes[i] === 1) {
            gl.disableVertexAttribArray(i);
            enabledAttributes[i] = 0;
        }
    }

    return this;
};

var getExtension_lowerPrefixes = ["webkit", "moz", "o", "ms"],
    getExtension_upperPrefixes = ["WEBKIT", "MOZ", "O", "MS"];

WebGLRenderer.prototype.getExtension = function(name) {
    var gl = this.gl,
        extensions = this.__extensions || (this.__extensions = {}),
        extension = extensions[name] || (extensions[name] = gl.getExtension(name)),
        i;

    if (extension == null) {
        i = getExtension_prefixes.length;

        while (i--) {
            if ((extension = gl.getExtension(getExtension_upperPrefixes[i] + "_" + name))) {
                extensions[name] = extension;
                break;
            }
        }
    }
    if (extension == null) {
        i = getExtension_prefixes.length;

        while (i--) {
            if ((extension = gl.getExtension(getExtension_lowerPrefixes[i] + name))) {
                extensions[name] = extension;
                break;
            }
        }
    }

    if (extension == null) {
        throw new Error("WebGLRenderer.getExtension: could not get Extension " + name);
    }

    return extension;
};


function handleWebGLRendererContextLost(_this, e) {
    e.preventDefault();
    clearGLContext(_this);
    _this.emit("webglcontextlost", e);
}

function handleWebGLRendererContextRestored(e) {
    e.preventDefault();
    getGLContext(_this);
    _this.emit("webglcontextrestored", e);
}

function getGLContext(_this) {
    var gl;

    if (_this.gl != null) {
        clearGLContext(_this);
    }

    gl = getWebGLContext(_this.element, _this.__attributes);

    if (gl == null) {
        _this.emit("webglcontextcreationfailed");
        return;
    }

    gl.getShaderPrecisionFormat = gl.getShaderPrecisionFormat || getShaderPrecisionFormat;

    _this.gl = gl;
    getGPUInfo(_this);
    _this.resetGL();
}

function clearGLContext(_this) {
    _this.resetGL();
}

function getShaderPrecisionFormat() {
    return {
        rangeMin: 1,
        rangeMax: 1,
        precision: 1
    };
}

function getAttributes(_this, options) {
    var attributes = _this.__attributes || (_this.__attributes = {});

    attributes.alpha = options.alpha != null ? !!options.alpha : true;
    attributes.antialias = options.antialias != null ? !!opts.antialias : true;
    attributes.depth = options.depth != null ? !!options.depth : true;
    attributes.premultipliedAlpha = options.premultipliedAlpha != null ? !!options.premultipliedAlpha : true;
    attributes.preserveDrawingBuffer = options.preserveDrawingBuffer != null ? !!options.preserveDrawingBuffer : false;
    attributes.stencil = options.stencil != null ? !!options.stencil : true;

    return attributes;
}

function getGPUInfo(_this) {
    var gl = _this.gl,

        VERTEX_SHADER = gl.VERTEX_SHADER,
        FRAGMENT_SHADER = gl.FRAGMENT_SHADER,
        HIGH_FLOAT = gl.HIGH_FLOAT,
        MEDIUM_FLOAT = gl.MEDIUM_FLOAT,

        EXT_texture_filter_anisotropic = _this.getExtension("EXT_texture_filter_anisotropic"),

        vsHighpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT),
        vsMediumpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, MEDIUM_FLOAT),

        fsHighpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT),
        fsMediumpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, MEDIUM_FLOAT),

        highpAvailable = vsHighpFloat.precision > 0 && fsHighpFloat.precision > 0,
        mediumpAvailable = vsMediumpFloat.precision > 0 && fsMediumpFloat.precision > 0,

        precision = "highp";

    if (!highpAvailable || environment.mobile) {
        if (mediumpAvailable) {
            precision = "mediump";
        } else {
            precision = "lowp";
        }
    }

    _this.__precision = precision;
    _this.__maxAnisotropy = EXT_texture_filter_anisotropic ? gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    _this.__maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    _this.__maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    _this.__maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    _this.__maxCubeTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    _this.__maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

    _this.__maxUniforms = mathf.max(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS), gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)) * 4;
    _this.__maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS) * 4;
    _this.__maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

    _this.__enabledAttributes = new NativeUint8Array(_this.__maxAttributes);
}

var getWebGLContext_webglNames = ["3d", "moz-webgl", "experimental-webgl", "webkit-3d", "webgl"],
    getWebGLContext_attuibutes = {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true
    };

function getWebGLContext(canvas, attributes) {
    var i = getWebGLContext_webglNames.length,
        gl, key;

    attributes || (attributes = {});

    for (key in getWebGLContext_attuibutes) {
        if (attributes[key] == null) {
            attributes[key] = getWebGLContext_attuibutes[key];
        }
    }

    while (i--) {
        try {
            gl = canvas.getContext(getWebGLContext_webglNames[i], attributes);
            if (gl) {
                return gl;
            }
        } catch (err) {}
    }
    if (!gl) {
        throw new Error("WebGLRenderer: could not get a WebGL Context");
    }

    return gl;
}

function createShader(gl, source, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("createShader: problem compiling shader " + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram(gl, vertex, fragment) {
    var program = gl.createProgram(),
        shader;

    shader = createShader(gl, vertex, gl.VERTEX_SHADER);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);

    shader = createShader(gl, fragment, gl.FRAGMENT_SHADER);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);

    gl.linkProgram(program);
    gl.validateProgram(program);
    gl.useProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        throw new Error("createProgram: problem compiling Program " + gl.getProgramInfoLog(program));
    }

    return program;
}
