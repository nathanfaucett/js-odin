var audio = require("audio"),
    vec2 = require("vec2"),
    vec3 = require("vec3"),
    Component = require("./index");


var ComponentPrototype = Component.prototype,
    AudioSourcePrototype;


module.exports = AudioSource;


function AudioSource() {
    var _this = this;

    Component.call(this);

    this.offset = vec3.create();

    this.audioAsset = null;

    this.__source = new audio.Source();

    this.__source.on("play", function onPlay() {
        _this.emit("play");
    });
    this.__source.on("pause", function onPause() {
        _this.emit("pause");
    });
    this.__source.on("stop", function onStop() {
        _this.emit("stop");
    });
    this.__source.on("end", function onEnd() {
        _this.emit("end");
    });
}
Component.extend(AudioSource, "odin.AudioSource");
AudioSourcePrototype = AudioSource.prototype;

AudioSourcePrototype.construct = function(audioAsset, options) {

    ComponentPrototype.construct.call(this);

    this.audioAsset = audioAsset;

    this.__source.setClip(audioAsset.clip);
    this.__source.construct(options);

    if (options) {
        if (options.offset) {
            vec2.copy(this.offset, options.offset);
        }
    }

    return this;
};

AudioSourcePrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.audioAsset = null;

    this.__source.destructor();

    return this;
};

AudioSourcePrototype.setOffset = function(value) {
    vec3.set(this.offset, value);
    return this;
};

AudioSourcePrototype.setClip = function(value) {
    this.__source.setClip(value);
    return this;
};

AudioSourcePrototype.setPanningModel = function(value) {
    this.__source.setPanningModel(value);
    return this;
};

AudioSourcePrototype.setDistanceModel = function(value) {
    this.__source.setDistanceModel(value);
    return this;
};

AudioSourcePrototype.setRefDistance = function(value) {
    this.__source.setRefDistance(value);
    return this;
};

AudioSourcePrototype.setMaxDistance = function(value) {
    this.__source.setMaxDistance(value);
    return this;
};

AudioSourcePrototype.setRolloffFactor = function(value) {
    this.__source.setRolloffFactor(value);
    return this;
};

AudioSourcePrototype.setConeInnerAngle = function(value) {
    this.__source.setConeInnerAngle(value);
    return this;
};

AudioSourcePrototype.setConeOuterAngle = function(value) {
    this.__source.setConeOuterAngle(value);
    return this;
};

AudioSourcePrototype.setConeOuterGain = function(value) {
    this.__source.setConeOuterGain(value);
    return this;
};

AudioSourcePrototype.setAmbient = function(value) {
    this.__source.setAmbient(value);
    return this;
};

AudioSourcePrototype.setDopplerLevel = function(value) {
    this.__source.setDopplerLevel(value);
    return this;
};

AudioSourcePrototype.setVolume = function(value) {
    this.__source.setVolume(value);
    return this;
};

AudioSourcePrototype.setLoop = function(value) {
    this.__source.setLoop(value);
    return this;
};

AudioSourcePrototype.play = function(delay, offset, duration) {
    this.__source.play(delay, offset, duration);
    return this;
};

AudioSourcePrototype.pause = function() {
    this.__source.pause();
    return this;
};

AudioSourcePrototype.stop = function() {
    this.__source.stop();
    return this;
};

var update_position = vec3.create(),
    update_orientation = vec3.create(0.0, 0.0, 1.0),
    update_tmp0 = vec3.create();
AudioSourcePrototype.update = function() {
    var source = this.__source,
        dopplerLevel, entity, scene, camera, transform, transform2d, position, orientation;

    ComponentPrototype.update.call(this);

    if (source.playing) {
        dopplerLevel = source.dopplerLevel;
        entity = this.entity;
        scene = entity && entity.scene;
        camera = scene && scene.hasManager("odin.Camera") && scene.getManager("odin.Camera").getActive();

        if (!source.ambient) {
            transform = entity.components["odin.Transform"];
            transform2d = entity.components["odin.Transform2D"];
            position = update_position;
            orientation = update_tmp0;

            if (transform) {
                vec3.copy(position, this.offset);
                vec3.transformMat4(position, position, transform.getMatrixWorld());
                vec3.transformMat4Rotation(orientation, update_orientation, transform.getMatrixWorld());
            } else if (transform2d) {

                vec2.copy(position, this.offset);

                if (camera && camera.orthographic) {
                    position[2] = camera.orthographicSize * 0.5;
                } else {
                    position[2] = 0.0;
                }

                vec2.transformMat4(position, position, transform2d.getMatrixWorld());
                vec3.transformMat4Rotation(orientation, update_orientation, transform2d.getMatrixWorld());
            }
            vec3.normalize(orientation, orientation);

            source.setPosition(position);
            source.setOrientation(orientation);
        }
    }

    return this;
};

AudioSourcePrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.offset = vec3.copy(json.offset || [], this.offset);
    json.source = this.__source.toJSON(json.source);

    return json;
};

AudioSourcePrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    vec3.copy(this.offset, json.offset);
    this.__source.fromJSON(json.source);

    return this;
};
