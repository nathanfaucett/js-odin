var Asset = require("./asset"),
    request = require("request"),
    HttpError = require("http_error");


var JSONAssetPrototype;


module.exports = JSONAsset;


function JSONAsset() {
    Asset.call(this);
}
Asset.extend(JSONAsset, "JSONAsset");
JSONAssetPrototype = JSONAsset.prototype;

JSONAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src;

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

    return this;
};
