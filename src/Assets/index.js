var Class = require("../Class"),
    indexOf = require("index_of");


var ClassPrototype = Class.prototype,
    AssetsPrototype;


module.exports = Assets;


function Assets() {

    Class.call(this);

    this.__notLoaded = [];
    this.__array = [];
    this.__hash = {};
}
Class.extend(Assets, "Assets");
AssetsPrototype = Assets.prototype;

AssetsPrototype.construct = function() {

    ClassPrototype.construct.call(this);

    return this;
};

AssetsPrototype.destructor = function() {
    var array = this.__array,
        hash = this.__hash,
        i = -1,
        il = array.length - 1,
        asset;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        asset = array[i];
        asset.destructor();

        array.splice(i, 1);
        delete hash[asset.name];
    }

    this.__notLoaded.length = 0;

    return this;
};

AssetsPrototype.has = function(name) {
    return !!this.__hash[name];
};

AssetsPrototype.get = function(name) {
    return this.__hash[name];
};

AssetsPrototype.addAsset = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_addAsset(this, arguments[i]);
    }

    return this;
};

function Assets_addAsset(_this, asset) {
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
        throw new Error("Assets addAsset(...assets) Assets already has member named " + name);
    }
}

AssetsPrototype.removeAsset = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_removeAsset(this, arguments[i]);
    }

    return this;
};

function Assets_removeAsset(_this, asset) {
    var name = asset.name,
        hash = _this.__hash,
        notLoaded = _this.__notLoaded,
        array = _this.__array,
        index;

    if (hash[name]) {
        delete hash[name];
        array.splice(indexOf(array, asset), 1);

        if ((index = indexOf(notLoaded, asset))) {
            notLoaded.splice(index, 1);
        }
    } else {
        throw new Error("Assets removeAsset(...assets) Assets do not have a member named " + name);
    }
}

AssetsPrototype.load = function(callback) {
    var _this = this,
        notLoaded = this.__notLoaded,
        length = notLoaded.length,
        i, il, called, done;

    if (length === 0) {
        callback();
    } else {
        i = -1;
        il = length - 1;
        called = false;

        done = function done(err) {
            if (called) {
                return;
            }
            if (err || --length === 0) {
                called = true;
                if (callback) {
                    callback(err);
                }
                _this.emit("load");
            }
        };

        while (i++ < il) {
            notLoaded[i].load(done);
        }
        notLoaded.length = 0;
    }

    return this;
};
