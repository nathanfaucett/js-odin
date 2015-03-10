var mat3 = require("mat3"),
    mat4 = require("mat4"),
    Geometry = require("../assets/geometry"),
    ComponentRenderer = require("./component_renderer");


var NativeUint16Array = typeof(Uint16Array) !== "undefined" ? Uint16Array : Array,
    NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = SpriteRenderer;


function SpriteRenderer() {
    var geometry = Geometry.create();

    ComponentRenderer.call(this);

    geometry
        .addAttribute("position", 12, 3, NativeFloat32Array, false, [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0,
            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0
        ])
        .addAttribute("normal", 12, 3, NativeFloat32Array, false, [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ])
        .addAttribute("tangent", 16, 4, NativeFloat32Array, false, [
            0.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0
        ])
        .addAttribute("uv", 8, 2, NativeFloat32Array, false, [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ]);

    geometry.index = new NativeUint16Array([
        0, 1, 2, 3, 2, 1
    ]);

    this.geometry = geometry;
    this.spriteGeometry = null;
}
ComponentRenderer.extend(SpriteRenderer, "SpriteRenderer", "Sprite");

SpriteRenderer.prototype.init = function() {
    this.spriteGeometry = this.renderer.geometry(this.geometry);
};

var modelView = mat4.create(),
    normalMatrix = mat3.create();

SpriteRenderer.prototype.render = function(sprite, camera) {
    var renderer = this.renderer,
        context = renderer.context,
        gl = context.gl,

        transform = sprite.sceneObject.components.Transform,

        spriteMaterial = sprite.material,
        spriteGeometry = this.geometry,

        geometry = renderer.geometry(spriteGeometry),
        program = renderer.material(spriteMaterial).getProgramFor(spriteGeometry),

        indexBuffer;

    transform.calculateModelView(camera.view, modelView);
    transform.calculateNormalMatrix(modelView, normalMatrix);

    context.setProgram(program);
    renderer.bindUniforms(camera.projection, modelView, normalMatrix, spriteMaterial.uniforms, null, program.uniforms);
    renderer.bindAttributes(geometry.buffers.__hash, geometry.getVertexBuffer(), program.attributes);

    if (spriteMaterial.wireframe !== true) {
        indexBuffer = geometry.getIndexBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    } else {
        indexBuffer = geometry.getLineBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.LINES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }

    return this;
};
