var odin = require("../../.."),
    vec2 = require("vec2");


var Component = odin.Component,
    ComponentPrototype = Component.prototype,
    BoxControlPrototype;


module.exports = BoxControl;


function BoxControl() {

    Component.call(this);

    this.offset = 0.0;
    this.position = 0.0;

    this.__startTime = 0.0;
    this.__currentTime = 0.0;
}
Component.extend(BoxControl, "sound.BoxControl");
BoxControlPrototype = BoxControl.prototype;

BoxControlPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    if (options) {
        if (options.offset) {
            this.offset = options.offset;
        }
        if (options.position) {
            this.position = options.position;
        }
    }

    return this;
};

BoxControlPrototype.update = function update() {
    var entity = this.entity,
        scene = entity.scene,
        input = scene.input,
        dt = scene.time.delta,
        transform = entity.getComponent("odin.Transform") || entity.getComponent("odin.Transform2D"),
        audioSource = entity.getComponent("odin.AudioSource");

    if (this.__startTime < this.offset) {
        this.__startTime += dt;
    } else {
        this.__currentTime += dt;

        if (this.__currentTime >= 1) {
            this.__currentTime = 0.0;
            audioSource.play();
        }
    }

    this.position += dt;
    transform.position[0] = 3 * Math.cos(this.position);
    transform.position[1] = 3 * Math.sin(this.position);
};
