var Class = require("../base/class");


var ClassPrototype = Class.prototype;


module.exports = Assets;


function Assets() {
    Class.call(this);
}
Class.extend(Assets, "Assets");

Assets.prototype.construct = function() {

    ClassPrototype.construct.call(this);

    this.__notLoaded = [];
    this.__array = [];
    this.__hash = {};

    return this;
};

Assets.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.__notLoaded = null;
    this.__array = null;
    this.__hash = null;

    return this;
};

Assets.prototype.has = function(name) {
    return !!this.__hash[name];
};

Assets.prototype.get = function(name) {
    return this.__hash[name];
};

Assets.prototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_add(this, arguments[i]);
    }

    return this;
};

function Assets_add(_this, asset) {
    var name = asset.name,
        hash = _this.__hash,
        notLoaded = _this.__notLoaded,
        array = _this.__array;

    if (!hash[name]) {
        hash[name] = asset;
        array[array.length] = asset;

        if (asset.src != null) {
            notLoaded[notLoaded.length] = asset;
        }
    } else {
        throw new Error("Assets add(...assets) Assets already has member named " + name);
    }
}

Assets.prototype.load = function(callback) {
    var _this = this,
        notLoaded = this.__notLoaded,
        length = notLoaded.length,
        i = -1,
        il = length - 1,
        called = false;

    function done(err) {
        if (called) {
            return;
        }
        if (err || --length === 0) {
            called = true;
            callback && callback(err);
            _this.emit("load");
        }
    }

    while (i++ < il) {
        notLoaded[i].load(done);
    }

    notLoaded.length = 0;

    return this;
};
