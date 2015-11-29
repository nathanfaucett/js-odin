var vec3 = require("vec3"),
    quat = require("quat"),
    mathf = require("mathf"),
    isNullOrUndefined = require("is_null_or_undefined"),
    Component = require("./index"),
    wrapMode = require("../enums/wrapMode");


var ComponentPrototype = Component.prototype,
    MeshAnimationPrototype;


module.exports = MeshAnimation;


function MeshAnimation() {

    Component.call(this);

    this.animations = null;

    this.current = "idle";
    this.mode = wrapMode.LOOP;

    this.rate = 1 / 24;
    this.playing = false;

    this.__time = 0;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
}
Component.extend(MeshAnimation, "odin.MeshAnimation");
MeshAnimationPrototype = MeshAnimation.prototype;

MeshAnimationPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.animations = options.animations || {};

    this.current = isNullOrUndefined(options.current) ? "idle" : options.current;
    this.mode = isNullOrUndefined(options.mode) ? wrapMode.LOOP : options.mode;

    this.rate = isNullOrUndefined(options.rate) ? 1 / 24 : options.rate;
    this.playing = false;

    return this;
};

MeshAnimationPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.animations = null;

    this.current = "idle";
    this.mode = wrapMode.LOOP;

    this.rate = 1 / 24;
    this.playing = false;

    this.__time = 0;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;

    return this;
};

var update_position = vec3.create(),
    update_lastPosition = vec3.create(),
    update_scale = vec3.create(),
    update_lastScale = vec3.create(),
    update_rotation = quat.create(),
    update_lastRotation = quat.create();

MeshAnimationPrototype.update = function() {
    var alpha = 0,
        position, rotation, scale,
        lastPosition, lastRotation, lastScale,
        currentPosition, currentRotation, currentScale,
        boneCurrent, boneTransform, parentIndex, boneFrame, lastBoneFrame,
        current, count, length, order, frame, lastFrame, mode, frameState, lastFrameState, entity, bones, i, il;

    entity = this.entity;
    current = this.animations.data[this.current];

    if (!current) {
        return this;
    }

    order = this.__order;
    frame = this.__frame;
    lastFrame = this.__lastFrame;
    mode = this.mode;

    if (!this.rate || this.rate === Infinity || this.rate < 0) {
        frame = mathf.abs(frame) % current.length;
    } else {
        this.__time += entity.scene.time.delta;
        count = this.__time / this.rate;
        alpha = count;

        if (count >= 1) {
            lastFrame = frame;
            alpha = 0;

            this.__time = 0;
            length = current.length;
            frame += (order * (count | 0));

            if (mode === wrapMode.LOOP) {
                frame = frame % length;
            } else if (mode === wrapMode.ONCE) {
                if (order > 0) {
                    if (frame >= length) {
                        frame = length - 1;
                        this.stop();
                    }
                } else {
                    if (frame < 0) {
                        frame = 0;
                        this.stop();
                    }
                }
            } else if (mode === wrapMode.PING_PONG) {
                if (order > 0) {
                    if (frame >= length) {
                        this.__order = -1;
                        frame = length - 1;
                    }
                } else {
                    if (frame < 0) {
                        this.__order = 1;
                        frame = 0;
                    }
                }
            } else if (mode === wrapMode.CLAMP) {
                if (order > 0) {
                    if (frame >= length) {
                        frame = length - 1;
                    }
                } else {
                    if (frame < 0) {
                        frame = 0;
                    }
                }
            }
        }
    }

    alpha = mathf.clamp01(alpha);
    frameState = current[frame];
    lastFrameState = current[lastFrame] || frameState;

    currentPosition = update_position;
    currentRotation = update_rotation;
    currentScale = update_scale;

    lastPosition = update_lastPosition;
    lastRotation = update_lastRotation;
    lastScale = update_lastScale;

    bones = entity.components["odin.Mesh"].bones;
    i = -1;
    il = bones.length - 1;

    while (i++ < il) {
        boneCurrent = bones[i];

        boneTransform = boneCurrent.components["odin.Transform"];
        parentIndex = boneCurrent.parentIndex;

        position = boneTransform.position;
        rotation = boneTransform.rotation;
        scale = boneTransform.scale;

        boneFrame = frameState[i];
        lastBoneFrame = lastFrameState[i];

        lastPosition[0] = lastBoneFrame[0];
        lastPosition[1] = lastBoneFrame[1];
        lastPosition[2] = lastBoneFrame[2];

        lastRotation[0] = lastBoneFrame[3];
        lastRotation[1] = lastBoneFrame[4];
        lastRotation[2] = lastBoneFrame[5];
        lastRotation[3] = lastBoneFrame[6];

        lastScale[0] = lastBoneFrame[7];
        lastScale[1] = lastBoneFrame[8];
        lastScale[2] = lastBoneFrame[9];

        currentPosition[0] = boneFrame[0];
        currentPosition[1] = boneFrame[1];
        currentPosition[2] = boneFrame[2];

        currentRotation[0] = boneFrame[3];
        currentRotation[1] = boneFrame[4];
        currentRotation[2] = boneFrame[5];
        currentRotation[3] = boneFrame[6];

        currentScale[0] = boneFrame[7];
        currentScale[1] = boneFrame[8];
        currentScale[2] = boneFrame[9];

        vec3.lerp(position, lastPosition, currentPosition, alpha);
        quat.lerp(rotation, lastRotation, currentRotation, alpha);
        vec3.lerp(scale, lastScale, currentScale, alpha);
    }

    this.__frame = frame;
    this.__lastFrame = lastFrame;

    return this;
};

MeshAnimationPrototype.play = function(name, mode, rate) {
    if ((this.playing && this.current === name) || !this.animations.data[name]) {
        return this;
    }

    this.playing = true;

    this.current = name;
    this.rate = isNullOrUndefined(rate) ? (rate = this.rate) : rate;
    this.mode = mode || (mode = this.mode);
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
    this.__time = 0;

    this.emit("play", name, mode, rate);

    return this;
};

MeshAnimationPrototype.stop = function() {
    if (this.playing) {
        this.emit("stop");
    }

    this.playing = false;
    this.__frame = 0;
    this.__lastFrame = 0;
    this.__order = 1;
    this.__time = 0;

    return this;
};

MeshAnimationPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.animations = this.animations.name;

    return json;
};

MeshAnimationPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.animations = this.entity.scene.assets.get(json.animations);

    return this;
};
