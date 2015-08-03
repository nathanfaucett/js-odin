var isArray = require("is_array"),
    audio = require("audio"),
    forEach = require("for_each"),
    eventListener = require("event_listener"),
    Asset = require("./Asset");


var AssetPrototype = Asset.prototype,
    AudioAssetPrototype;


module.exports = AudioAsset;


function AudioAsset() {
    Asset.call(this);
}
Asset.extend(AudioAsset, "odin.AudioAsset");
AudioAssetPrototype = AudioAsset.prototype;

AudioAssetPrototype.construct = function(name, src) {

    AssetPrototype.construct.call(this, name, null);

    this.setSrc(src);

    return this;
};

AudioAssetPrototype.destructor = function() {

    AssetPrototype.destructor.call(this);

    return this;
};

AudioAssetPrototype.setSrc = function(src) {

    AssetPrototype.setSrc.call(this, isArray(src) ? src : [src]);

    return this;
};

AudioAssetPrototype.load = function(callback) {
    var _this = this,
        count = this.src.length,
        called = false;

    function done() {
        if (called === false) {
            count -= 1;

            if (_this.data) {
                called = true;
                callback();
            } else if (count === 0) {
                called = true;
                callback(new Error("AudioAsset load(): no valid source for audio asset " + _this.name));
            }
        }
    }

    forEach(this.src, function(src) {
        var request = new XMLHttpRequest();

        request.open("GET", src, true);
        request.responseType = "arraybuffer";

        eventListener.on(request, "load", function onLoad() {
            audioContext.decodeAudioData(
                request.response,
                function onDecodeAudioData(buffer) {
                    _this.raw = buffer;
                    done();
                },
                done
            );
        })

        request.send(null);
    });

    return this;
};
