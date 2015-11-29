var Class = require("class");


var ClassPrototype = Class.prototype,
    FrameBufferPrototype;


module.exports = FrameBuffer;


function FrameBuffer() {

    Class.call(this);

    this.depthBuffer = true;
    this.stencilBuffer = true;
    this.texture = null;
}

Class.extend(FrameBuffer, "odin.FrameBuffer");
FrameBufferPrototype = FrameBuffer.prototype;

FrameBufferPrototype.construct = function(options) {

    ClassPrototype.construct.call(this);

    options = options || {};

    this.depthBuffer = !!options.depthBuffer ? !!options.depthBuffer : this.depthBuffer;
    this.stencilBuffer = !!options.stencilBuffer ? !!options.stencilBuffer : this.stencilBuffer;
    this.texture = options.texture;

    return this;
};

FrameBufferPrototype.setDepthBuffer = function(depthBuffer) {

    this.depthBuffer = !!depthBuffer;
    this.emit("update");

    return this;
};

FrameBufferPrototype.setStencilBuffer = function(stencilBuffer) {

    this.stencilBuffer = !!stencilBuffer;
    this.emit("update");

    return this;
};
