var request = require("request"),
    HttpError = require("http_error"),
    Asset = require("./Asset");


var JSONAssetPrototype;


module.exports = JSONAsset;


function JSONAsset() {
    Asset.call(this);
}
Asset.extend(JSONAsset, "odin.JSONAsset");
JSONAssetPrototype = JSONAsset.prototype;

JSONAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src;

    if (src) {
        request.get(src, {
            requestHeaders: {
                "Content-Type": "application/json"
            },
            success: function(response) {
                _this.data = response.data;
                _this.parse();
                _this.emit("load");
                callback();
            },
            error: function(response) {
                var err = new HttpError(response.statusCode, src);

                _this.emit("error", err);
                callback(err);
            }
        });
    } else {
        callback();
    }

    return this;
};
