var FastHash = require("fast_hash");


var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array,
    NativeUint16Array = typeof(Uint16Array) !== "undefined" ? Uint16Array : Array;


module.exports = RendererGeometry;


function RendererGeometry() {

    this.context = null;
    this.geometry = null;

    this.buffers = new FastHash("name");

    this.glVertexBuffer = null;
    this.glIndexBuffer = null;
    this.glIndexLineBuffer = null;

    this.needsCompile = null;
    this.needsLineCompile = null;
}

RendererGeometry.create = function(context, geometry) {
    return (new RendererGeometry()).construct(context, geometry);
};

RendererGeometry.prototype.construct = function(context, geometry) {

    this.context = context;
    this.geometry = geometry;

    this.glVertexBuffer = context.createBuffer();
    this.glIndexBuffer = context.createBuffer();
    this.glIndexLineBuffer = null;

    this.needsCompile = true;
    this.needsLineCompile = true;

    return this;
};

RendererGeometry.prototype.destructor = function() {

    this.context = null;
    this.geometry = null;

    this.buffers.clear();

    this.glVertexBuffer = null;
    this.glIndexBuffer = null;
    this.glIndexLineBuffer = null;

    this.needsCompile = null;
    this.needsLineCompile = null;

    return this;
};

RendererGeometry.prototype.compile = function() {
    if (this.needsCompile === false) {
        return this;
    } else {
        this.glVertexBuffer.needsCompile = true;
        this.glIndexBuffer.needsCompile = true;
        return RendererGeometry_compile(this);
    }
};

RendererGeometry.prototype.getLineBuffer = function() {
    var glIndexLineBuffer = this.glIndexLineBuffer;

    if (glIndexLineBuffer) {
        if (this.needsLineCompile === false) {
            return glIndexLineBuffer;
        } else {
            glIndexLineBuffer.needsCompile = true;
            return RendererGeometry_compileLineBuffer(this);
        }
    } else {
        return RendererGeometry_compileLineBuffer(this);
    }
};

function RendererGeometry_compileLineBuffer(_this) {
    var context = _this.context,
        gl = context.gl,

        geometry = _this.geometry,
        indexArray = geometry.index,

        length = indexArray.length,
        i = 0,

        lineBuffer = new NativeUint16Array(length * 2),
        glIndexLineBuffer = _this.glIndexLineBuffer || (_this.glIndexLineBuffer = context.createBuffer()),

        triangleIndex = 0,
        index = 0;

    while (i < length) {
        lineBuffer[index] = indexArray[triangleIndex];
        lineBuffer[index + 1] = indexArray[triangleIndex + 1];

        lineBuffer[index + 2] = indexArray[triangleIndex + 1];
        lineBuffer[index + 3] = indexArray[triangleIndex + 2];

        lineBuffer[index + 4] = indexArray[triangleIndex + 2];
        lineBuffer[index + 5] = indexArray[triangleIndex];

        triangleIndex += 3;
        index += 6;
        i += 3;
    }

    _this.needsLineCompile = false;

    return glIndexLineBuffer.compile(gl.ELEMENT_ARRAY_BUFFER, lineBuffer, 0, gl.STATIC_DRAW);
}

function RendererGeometry_compile(_this) {
    var context = _this.context,
        gl = context.gl,

        geometry = _this.geometry,
        indexArray = geometry.index,
        attributes = geometry.attributes.__array,

        buffers = _this.buffers,

        vertexLength = 0,
        stride = 0,
        last = 0,
        offset = 0,

        i = -1,
        il = attributes.length - 1,

        vertexArray, attribute, attributeArray, itemSize, index, j, jl, k, kl;

    buffers.clear();

    while (i++ < il) {
        attribute = attributes[i];
        vertexLength += attribute.array.length;
        stride += attribute.itemSize;
    }

    vertexArray = new NativeFloat32Array(vertexLength);

    i = -1;
    while (i++ < il) {
        attribute = attributes[i];
        attributeArray = attribute.array;

        j = 0;
        jl = vertexLength;

        itemSize = attribute.itemSize;
        index = 0;

        offset += last;
        last = itemSize;

        while (j < jl) {
            k = -1;
            kl = itemSize - 1;

            while (k++ < kl) {
                vertexArray[offset + j + k] = attributeArray[index + k];
            }

            j += stride;
            index += itemSize;
        }

        buffers.add(new DataBuffer(attribute.name, offset * 4));
    }

    _this.glVertexBuffer.compile(gl.ARRAY_BUFFER, vertexArray, stride * 4, gl.STATIC_DRAW);
    _this.glIndexBuffer.compile(gl.ELEMENT_ARRAY_BUFFER, indexArray, 0, gl.STATIC_DRAW);

    _this.needsCompile = false;

    return _this;
}

function DataBuffer(name, offset) {
    this.name = name;
    this.offset = offset;
}
