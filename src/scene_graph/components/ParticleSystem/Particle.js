var vec3 = require("vec3"),
    color = require("color");


var ParticlePrototype;


module.exports = Particle;


function Particle() {
    this.z = 1;
    this.alpha = 1;

    this.lifeTime = 0;
    this.life = 1;

    this.size = 1;

    this.color = color.create();

    this.position = vec3.create();
    this.velocity = vec3.create();
    this.acceleration = vec3.create();

    this.angle = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
}
ParticlePrototype = Particle.prototype;

ParticlePrototype.update = function(dt) {
    var pos = this.position,
        vel = this.velocity,
        acc = this.acceleration;

    vel[0] += acc[0] * dt;
    vel[1] += acc[1] * dt;
    vel[2] += acc[2] * dt;

    pos[0] += vel[0] * dt;
    pos[1] += vel[1] * dt;
    pos[2] += vel[2] * dt;

    this.angularVelocity += this.angularAcceleration * dt;
    this.angle += this.angularVelocity * dt;

    this.lifeTime += dt;
};
