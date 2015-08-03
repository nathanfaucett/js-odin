var audio = require("audio"),
    vec2 = require("vec2"),
    vec3 = require("vec3"),
    isNumber = require("is_number"),
    Component = require("./Component");


var ComponentPrototype = Component.prototype,
    AudioSourcePrototype;


module.exports = AudioSource;


function AudioSource() {
    var _this = this;

    Component.call(this);

    this.offset = vec3.create();

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

AudioSourcePrototype.construct = function(clip, options) {

    ComponentPrototype.construct.call(this, clip);

    this.__source.setClip(clip);

    if (options) {
        if (options.ambient) {
            this.setAmbient(options.ambient);
        }
        if (isNumber(options.dopplerLevel)) {
            this.setDopplerLevel(options.dopplerLevel);
        }
        if (isNumber(options.volume)) {
            this.setVolume(options.volume);
        }
        if (options.loop) {
            this.setLoop(options.loop);
        }
    }

    return this;
};

AudioSourcePrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

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
    this.__source.setVolume(value);
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

var update_position = vec3.create();
AudioSourcePrototype.update = function() {
    var source = this.__source,
        dopplerLevel, entity, scene, camera, transform, transform2d, cameraTransform;

    ComponentPrototype.update.call(this);

    if (source.playing) {
        dopplerLevel = source.dopplerLevel;
        entity = this.entity;
        scene = entity && entity.scene;
        camera = scene && scene.hasManager("odin.Camera") && scene.getManager("odin.Camera").getActive();

        if (!source.ambient && camera) {
            transform = entity.components["odin.Transform"];
            transform2d = entity.components["odin.Transform2D"];
            cameraTransform = camera.entity.components["odin.Transform"] || camera.entity.components["odin.Transform2D"];

            if (transform2d) {
                vec2.add(update_position, transform2d.position, this.offset);
                vec2.sub(update_position, update_position, cameraTransform.position);
                if (dopplerLevel > 0) {
                    vec2.smul(update_position, dopplerLevel);
                }
            } else if (transform) {
                vec3.add(update_position, transform.position, this.offset);
                vec3.sub(update_position, update_position, cameraTransform.position);
                if (dopplerLevel > 0) {
                    vec3.smul(update_position, dopplerLevel);
                }
            }

            if (camera.orthographic) {
                update_position[2] = camera.orthographicSize * 0.5;
            }

            source.setPosition(update_position);
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
