var Class = require("../../../Class");


var ClassPrototype = Class.prototype,
    Emitter2DPrototype;


module.exports = Emitter2D;


function Emitter2D() {
    Class.call(this);
}
Class.extend(Emitter2D, "odin.ParticleSystem.Emitter2D");
Emitter2DPrototype = Emitter2D.prototype;

Emitter2DPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

Emitter2DPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    return this;
};

Emitter2DPrototype.update = function() {
    return this;
};

Emitter2DPrototype.toJSON = function(json) {

    json = ClassPrototype.toJSON.call(this, json);

    return json;
};

Emitter2DPrototype.fromJSON = function(json) {

    ClassPrototype.fromJSON.call(this, json);

    return this;
};
