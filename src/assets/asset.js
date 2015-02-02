var Class = require("../base/class");


var ClassPrototype = Class.prototype;


module.exports = Asset;


function Asset() {
    Class.call(this);
}
Class.extend(Asset, "Asset");

Asset.prototype.construct = function(name, src) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.src = src;

    return this;
};

Asset.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.name = null;
    this.src = null;
    this.data = null;

    return this;
};

Asset.prototype.setSrc = function(src) {

    this.src = src;
    return this;
};

Asset.prototype.parse = function() {

    return this;
};

Asset.prototype.load = function(callback) {
    callback();
    return this;
};
