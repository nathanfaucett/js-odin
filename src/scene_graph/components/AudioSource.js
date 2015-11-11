var audio = require("audio"),
    vec2 = require("vec2"),
    vec3 = require("vec3"),
    Component = require("./Component");


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

AudioSourcePrototype.setClip = function(value) {
    this.__source.setClip(value);
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
    update_orientation = vec3.create();
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
            orientation = update_orientation;

            if (transform) {
                vec3.add(position, transform.position, this.offset);
                vec3.transformProjectionNoPosition(orientation, position, transform.getMatrixWorld());
                vec3.normalize(orientation, orientation);
            } else if (transform2d) {
                position[2] = 0.0;
                vec2.add(position, transform2d.position, this.offset);
                vec3.transformProjectionNoPosition(orientation, position, transform2d.getMatrixWorld());
                vec3.normalize(orientation, orientation);
            }

            if (camera && camera.orthographic) {
                position[2] = camera.orthographicSize * 0.5;
            }

            source.setPosition(position);
            source.setOrientation(orientation);
        }
    }

    return this;
};

AudioSourcePrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

AudioSourcePrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};
