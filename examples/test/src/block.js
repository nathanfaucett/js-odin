var odin = require("../../../src/index"),
    mathf = require("mathf"),
    vec3 = require("vec3");


module.exports = Block;


function Block() {
    odin.Component.call(this);

    this.random = mathf.randFloat(-5, 5);
    this.velocity = vec3.create(0, 0, 0);
    this.angularVelocity = vec3.create(0, 0, 0);
}
odin.Component.extend(Block, "Block");

Block.prototype.update = function() {
    var sceneObject = this.sceneObject,
        time = sceneObject.scene.time,
        transform = sceneObject.getComponent("Transform");

    this.velocity[0] = mathf.sin(time.time) * this.random * time.delta;
    transform.translate(this.velocity);

    this.angularVelocity[0] = mathf.sin(time.time) * this.random * time.delta;
    this.angularVelocity[1] = mathf.cos(time.time) * this.random * time.delta;
    this.angularVelocity[2] = mathf.sin(time.time) * this.random * time.delta;
    transform.rotate(this.angularVelocity);
};
