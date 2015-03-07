var Asset = require("./asset"),
    request = require("request"),
    HttpError = require("http_error");


module.exports = TextAsset;


function TextAsset() {
    Asset.call(this);
}
Asset.extend(TextAsset, "TextAsset");

TextAsset.prototype.load = function(callback) {
    var _this = this,
        src = this.src;

    request.get(src, {
        requestHeaders: {
            "Content-Type": "text/plain"
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
