var vec2 = require("vec2"),
    color = require("color"),
    createPool = require("create_pool");


var Particle2DPrototype;


module.exports = Particle2D;


function Particle2D() {

    this.drag = 0.01;

    this.currentLife = 0;
    this.lifeTime = 1;

    this.size = 1;

    this.color = color.create();
    this.alpha = 1;

    this.position = vec2.create();
    this.velocity = vec2.create();
    this.acceleration = vec2.create();

    this.angle = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
}
createPool(Particle2D);
Particle2DPrototype = Particle2D.prototype;

Particle2DPrototype.update = function(dt) {
    var pos = this.position,
        vel = this.velocity,
        acc = this.acceleration;

    vel[0] += acc[0] * dt;
    vel[1] += acc[1] * dt;

    pos[0] += vel[0] * dt;
    pos[1] += vel[1] * dt;

    this.angularVelocity += this.angularAcceleration * dt;
    this.angle += this.angularVelocity * dt;

    this.currentLife += dt;
};
