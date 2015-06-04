var mat3 = require("mat3"),
    mat4 = require("mat4"),
    ComponentRenderer = require("./ComponentRenderer");


var MeshRendererPrototype;


module.exports = MeshRenderer;


function MeshRenderer() {
    ComponentRenderer.call(this);
}
ComponentRenderer.extend(MeshRenderer, "odin.MeshRenderer", "odin.Mesh", 1);
MeshRendererPrototype = MeshRenderer.prototype;

var modelView = mat4.create(),
    normalMatrix = mat3.create();

MeshRendererPrototype.render = function(mesh, camera) {
    var renderer = this.renderer,
        context = renderer.context,
        gl = context.gl,

        components = mesh.entity.components,
        transform = components["odin.Transform"] || components["odin.Transform2D"],

        meshMaterial = mesh.material,
        meshGeometry = mesh.geometry,

        geometry = renderer.geometry(meshGeometry),
        program = renderer.material(meshMaterial).getProgramFor(meshGeometry),

        indexBuffer;

    transform.calculateModelView(camera.view, modelView);
    transform.calculateNormalMatrix(modelView, normalMatrix);

    context.setProgram(program);
    renderer.bindUniforms(camera.projection, modelView, normalMatrix, meshMaterial.uniforms, program.uniforms);
    renderer.bindBoneUniforms(mesh.bones, program.uniforms);
    renderer.bindAttributes(geometry.buffers.__hash, geometry.getVertexBuffer(), program.attributes);

    if (meshMaterial.wireframe !== true) {
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
