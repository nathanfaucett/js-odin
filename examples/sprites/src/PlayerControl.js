var odin = require("../../.."),
    gamepads = require("gamepads"),
    vec2 = require("vec2");


gamepads.setMapping("0738-4716", require("../../content/mappings/MadCatz"));


module.exports = PlayerControl;


function PlayerControl() {

    odin.Component.call(this);

    this.velocity = vec2.create();
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
        
    if (input.buttonDown("gamepad0-button0")) {
        console.log("A");
    }
        
    velocity[0] = (input.axis("analogX") || input.axis("horizontal")) * dt;
    velocity[1] = (input.axis("analogY") || input.axis("vertical")) * dt;
    velLength = vec2.length(velocity) / dt;

    vec2.add(transform.position, transform.position, velocity);

    audioSource.setVolume(velLength);
    audioSource.play();
};
