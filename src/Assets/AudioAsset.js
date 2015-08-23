var isArray = require("is_array"),
    audio = require("audio"),
    arrayForEach = require("array-for_each"),
    Asset = require("./Asset");


var AssetPrototype = Asset.prototype,
    AudioAssetPrototype;


module.exports = AudioAsset;


function AudioAsset() {

    Asset.call(this);

    this.clip = new audio.Clip();
}
Asset.extend(AudioAsset, "odin.AudioAsset");
AudioAssetPrototype = AudioAsset.prototype;

AudioAssetPrototype.construct = function(name, src) {

    AssetPrototype.construct.call(this, name, null);

    this.setSrc(src);

    return this;
};

AudioAssetPrototype.destructor = function() {
    var clip = this.clip;

    AssetPrototype.destructor.call(this);

    clip.src = null;
    clip.raw = null;

    return this;
};

AudioAssetPrototype.setSrc = function(src) {
    AssetPrototype.setSrc.call(this, isArray(src) ? src : [src]);
    return this;
};

function abort(queue) {
    var i = -1,
        il = queue.length - 1;

    while (i++ < il) {
        queue[i]();
    }
}

AudioAssetPrototype.load = function(callback) {
    var _this = this,
        clip = this.clip,
        srcs = this.src,
        count = srcs.length,
        queue = [],
        called = false;

    function done(error, data) {
        if (called === false) {
            count -= 1;

            if (data) {
                called = true;
                _this.data = clip.raw = data;
                abort(queue);
                callback();
            } else if (count === 0) {
                called = true;
                abort(queue);
                callback(new Error("AudioAsset load(): no valid source for audio asset " + _this.name + " using srcs " + srcs.join(", ")));
            }
        }
    }

    arrayForEach(srcs, function eachSrc(src) {
        queue[queue.length] = audio.load(src, done);
    });

    return this;
};
