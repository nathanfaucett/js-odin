var Class = require("../../../Class");


var ClassPrototype = Class.prototype,
    EmitterPrototype;


module.exports = Emitter;


function Emitter() {
    Class.call(this);
}
Class.extend(Emitter, "odin.ParticleSystem.Emitter");
EmitterPrototype = Emitter.prototype;

EmitterPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

EmitterPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    return this;
};

EmitterPrototype.update = function() {
    return this;
};

EmitterPrototype.toJSON = function(json) {

    json = ClassPrototype.toJSON.call(this, json);

    return json;
};

EmitterPrototype.fromJSON = function(json) {

    ClassPrototype.fromJSON.call(this, json);

    return this;
};
