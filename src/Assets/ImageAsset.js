var environment = require("environment"),
    eventListener = require("event_listener"),
    HttpError = require("http_error"),
    Asset = require("./Asset");


var AssetPrototype = Asset.prototype,
    ImageAssetPrototype;


module.exports = ImageAsset;


function ImageAsset() {

    Asset.call(this);

    this.__listenedTo = null;
}
Asset.extend(ImageAsset, "odin.ImageAsset");
ImageAssetPrototype = ImageAsset.prototype;

ImageAssetPrototype.construct = function(options) {

    AssetPrototype.construct.call(this, options);

    if (options) {
        this.data = (environment.browser && options.src) ? new Image() : null;
    }

    this.__listenedTo = false;

    return this;
};

ImageAssetPrototype.destructor = function() {

    AssetPrototype.destructor.call(this);

    this.__listenedTo = null;

    return this;
};

ImageAssetPrototype.setSrc = function(src) {

    AssetPrototype.setSrc.call(this, src);

    if (this.__listenedTo) {
        this.image.src = src;
    }

    return this;
};

ImageAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src,
        image;

    if (src) {
        image = this.data;

        eventListener.on(image, "load", function() {
            _this.parse();
            _this.emit("load");
            callback();
        });

        eventListener.on(image, "error", function(e) {
            var err = new HttpError(e.status, src);

            _this.emit("error", err);
            callback(err);
        });

        image.src = src;
        this.__listenedTo = true;
    } else {
        callback();
    }

    return this;
};
