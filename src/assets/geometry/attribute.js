var NativeFloat32Array = typeof(Float32Array) !== "undefined" ? Float32Array : Array;


module.exports = Attribute;


function Attribute() {
    this.geometry = null;
    this.name = null;
    this.array = null;
    this.itemSize = null;
    this.dynamic = null;
}

Attribute.create = function(geometry, name, length, itemSize, ArrayType, dynamic, items) {
    return (new Attribute()).construct(geometry, name, length, itemSize, ArrayType, dynamic, items);
};

Attribute.prototype.construct = function(geometry, name, length, itemSize, ArrayType, dynamic, items) {

    ArrayType = ArrayType || NativeFloat32Array;

    this.geometry = geometry;
    this.name = name;
    this.array = new ArrayType(length);
    this.itemSize = itemSize;
    this.dynamic = !!dynamic;

    if (items) {
        this.array.set(items);
    }

    return this;
};

Attribute.prototype.destructor = function() {

    this.geometry = null;
    this.name = null;
    this.array = null;
    this.itemSize = null;
    this.dynamic = null;

    return this;
};

Attribute.prototype.setDynamic = function(value) {
    if (this.dynamic === value) {
        return this;
    }

    this.dynamic = value;
    return this;
};

Attribute.prototype.set = function(array) {

    this.array.set(array);
    return this;
};

Attribute.prototype.setX = function(index, x) {

    this.array[index * this.itemSize] = x;
    return this;
};

Attribute.prototype.setY = function(index, y) {

    this.array[index * this.itemSize + 1] = y;
    return this;
};

Attribute.prototype.setZ = function(index, z) {

    this.array[index * this.itemSize + 2] = z;
    return this;
};

Attribute.prototype.setXY = function(index, x, y) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;

    return this;
};

Attribute.prototype.setXYZ = function(index, x, y, z) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;

    return this;
};

Attribute.prototype.setXYZW = function(index, x, y, z, w) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;
    array[index + 3] = w;

    return this;
};
