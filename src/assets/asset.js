var Class = require("../class");


var ClassPrototype = Class.prototype,
    AssetPrototype;


module.exports = Asset;


function Asset() {

    Class.call(this);

    this.name = null;
    this.src = null;
    this.data = null;
}
Class.extend(Asset, "Asset");
AssetPrototype = Asset.prototype;

AssetPrototype.construct = function(name, src) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.src = src;

    return this;
};

AssetPrototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.name = null;
    this.src = null;
    this.data = null;

    return this;
};

AssetPrototype.setSrc = function(src) {
    this.src = src;
    return this;
};

AssetPrototype.parse = function() {
    this.emit("parse");
    return this;
};

AssetPrototype.load = function(callback) {
    this.emit("load");
    callback();
    return this;
};
