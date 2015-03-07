var odin = require("../../../src/index"),
    mathf = require("mathf"),
    vec3 = require("vec3");


module.exports = Block;


function Block() {
    odin.Component.call(this);

    this.random = mathf.randFloat(-5, 5);
    this.angularVelocity = vec3.create(0, 0, 0);
}
odin.Component.extend(Block, "Block");

Block.prototype.update = function() {
    var sceneObject = this.sceneObject,
        time = sceneObject.scene.time,
        transform = sceneObject.getComponent("Transform"),

        sin = mathf.sin(time.time * this.random),
        cos = mathf.cos(time.time * this.random);

    this.angularVelocity[0] = sin * this.random * time.delta;
    this.angularVelocity[1] = sin * this.random * time.delta;
    this.angularVelocity[2] = cos * this.random * time.delta;
    transform.rotate(this.angularVelocity);
};
