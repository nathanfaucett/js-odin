var odin = require("../../.."),
    vec2 = require("vec2");


module.exports = PlayerControl;


function PlayerControl() {
    odin.Component.call(this);

    this.velocity = vec2.create();
    this.paused = true;
}
odin.Component.extend(PlayerControl, "PlayerControl");

PlayerControl.prototype.update = function update() {
    var velocity = this.velocity,
        entity = this.entity,
        scene = entity.scene,
        input = scene.input,
        dt = scene.time.delta,
        transform = entity.getComponent("odin.Transform2D"),
        audioSource = entity.getComponent("odin.AudioSource"),
        velLength;

    velocity[0] = input.axis("horizontal") * dt;
    velocity[1] = input.axis("vertical") * dt;
    velLength = vec2.length(velocity) / dt;

    vec2.add(transform.position, transform.position, velocity);

    if (velLength > 0) {
        audioSource.play();
        audioSource.setVolume(velLength);
        this.paused = false;
    } else if (!this.paused) {
        audioSource.setVolume(0);
        audioSource.pause();
        this.paused = true;
    }
};
