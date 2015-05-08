var isNumber = require("is_number"),
    Component = require("./Component"),
    SpriteManager = require("../component_managers/SpriteManager");


var ComponentPrototype = Component.prototype,
    SpritePrototype;


module.exports = Sprite;


function Sprite() {

    Component.call(this);

    this.visible = true;

    this.layer = 0;
    this.z = 0;

    this.alpha = 1;

    this.material = null;

    this.width = 1;
    this.height = 1;

    this.x = 0;
    this.y = 0;

    this.w = 1;
    this.h = 1;
}
Component.extend(Sprite, "Sprite", SpriteManager);
SpritePrototype = Sprite.prototype;

SpritePrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.visible = options.visible != null ? !!options.visible : true;

    this.layer = isNumber(options.layer) ? (options.layer < 0 ? 0 : options.layer) : 0;
    this.z = isNumber(options.z) ? options.z : 0;

    this.alpha = options.alpha != null ? options.alpha : 1;

    this.material = options.material != null ? options.material : null;

    this.width = isNumber(options.width) ? options.width : 1;
    this.height = isNumber(options.height) ? options.height : 1;

    this.x = isNumber(options.x) ? options.x : 0;
    this.y = isNumber(options.y) ? options.y : 0;
    this.w = isNumber(options.w) ? options.w : 1;
    this.h = isNumber(options.h) ? options.h : 1;

    return this;
};

SpritePrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.visible = true;

    this.layer = 0;
    this.z = 0;

    this.alpha = 1;

    this.material = null;

    this.width = 1;
    this.height = 1;

    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;

    return this;
};

SpritePrototype.setLayer = function(layer) {
    var manager = this.manager;

    if (manager) {
        layer = isNumber(layer) ? (layer < 0 ? 0 : layer) : this.layer;

        if (layer !== this.layer) {
            manager.remove(this);
            this.layer = layer;
            manager.add(this);
            manager.setLayerAsDirty(layer);
        }
    } else {
        this.layer = isNumber(layer) ? (layer < 0 ? 0 : layer) : this.layer;
    }

    return this;
};

SpritePrototype.setZ = function(z) {
    var manager = this.manager;

    if (manager) {
        z = isNumber(z) ? z : this.z;

        if (z !== this.z) {
            this.z = z;
            manager.setLayerAsDirty(this.layer);
        }
    } else {
        this.z = isNumber(z) ? z : this.z;
    }

    return this;
};

SpritePrototype.setMaterial = function(material) {
    this.material = material;
    return this;
};

SpritePrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.material = this.material.name;

    return json;
};

SpritePrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.material = this.entity.scene.assets.get(json.material);

    return this;
};
