var keys = require("keys"),
    isArray = require("is_array"),
    isObject = require("is_object"),
    arrayForEach = require("array-for_each"),
    objectForEach = require("object-for_each"),
    request = require("request"),
    HttpError = require("http_error"),
    Asset = require("./Asset");


var REQUEST_HEADERS = {
        "Content-Type": "text/plain"
    },
    TextAssetPrototype;


module.exports = TextAsset;


function TextAsset() {
    Asset.call(this);
}
Asset.extend(TextAsset, "odin.TextAsset");
TextAssetPrototype = TextAsset.prototype;

TextAssetPrototype.load = function(callback) {
    var _this = this,
        src = this.src;

    function finalCallback(error, data) {
        if (error) {
            _this.emit("error", error);
            callback(error);
        } else {
            _this.data = data;
            _this.parse();
            _this.emit("load");
            callback();
        }
    }

    if (isArray(src)) {
        loadArray(src, finalCallback);
    } else if (isObject(src)) {
        loadObject(src, finalCallback);
    } else {
        loadText(src, finalCallback);
    }

    return this;
};

function loadArray(srcs, callback) {
    var length = srcs.length,
        data = new Array(length),
        index = 0;

    function done(error) {
        index += 1;
        if (error || index === length) {
            callback(error, data);
        }
    }

    arrayForEach(srcs, function onEach(src, index) {
        loadText(src, function onLoadText(error, value) {
            if (error) {
                done(error);
            } else {
                data[index] = value;
                done();
            }
        });
    });
}

function loadObject(srcs, callback) {
    var srcKeys = keys(srcs),
        length = srcKeys.length,
        data = {},
        index = 0;

    function done(error) {
        index += 1;
        if (error || index === length) {
            callback(error, data);
        }
    }

    objectForEach(srcs, function onEach(src, key) {
        loadText(src, function onLoadText(error, value) {
            if (error) {
                done(error);
            } else {
                data[key] = value;
                done();
            }
        });
    });
}

function loadText(src, callback) {
    request.get(src, {
        requestHeaders: REQUEST_HEADERS,
        success: function onSuccess(response) {
            callback(undefined, response.data);
        },
        error: function onError(response) {
            var error = new HttpError(response.statusCode, src);
            callback(error);
        }
    });
}
