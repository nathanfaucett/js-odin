module.exports = Attribute;


function Attribute() {
    this.destructor();
}

Attribute.create = function(name, length, itemSize, ArrayType) {
    return new Attribute().construct(name, length, itemSize, ArrayType);
};

Attribute.prototype.construct = function(name, length, itemSize, ArrayType) {

    ArrayType = ArrayType || Float32Array;

    this.name = name;
    this.array = new ArrayType(length);
    this.itemSize = itemSize;

    this.dynamic = false;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.destructor = function() {

    this.name = null;
    this.array = null;
    this.itemSize = null;

    this.dynamic = null;
    this.needsUpdate = null;

    return this;
};

Attribute.prototype.setDynamic = function(value) {
    if (this.dynamic === value) {
        return this;
    }

    this.dynamic = value;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.set = function(array) {

    this.array.set(array);
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setX = function(index, x) {

    this.array[index * this.itemSize] = x;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setY = function(index, y) {

    this.array[index * this.itemSize + 1] = y;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setZ = function(index, z) {

    this.array[index * this.itemSize + 2] = z;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setXY = function(index, x, y) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setXYZ = function(index, x, y, z) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;
    this.needsUpdate = true;

    return this;
};

Attribute.prototype.setXYZW = function(index, x, y, z, w) {
    var array = this.array;

    index = index * this.itemSize;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;
    array[index + 3] = w;
    this.needsUpdate = true;

    return this;
};
