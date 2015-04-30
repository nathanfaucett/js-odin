var Class = require("../class"),
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
        i = array.length,
        asset;

    ClassPrototype.destructor.call(this);

    while (i--) {
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

AssetsPrototype.add = function() {
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

AssetsPrototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Assets_remove(this, arguments[i]);
    }

    return this;
};

function Assets_remove(_this, asset) {
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
        throw new Error("Assets remove(...assets) Assets do not have a member named " + name);
    }
}

AssetsPrototype.load = function(callback) {
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
