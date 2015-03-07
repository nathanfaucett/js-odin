var isNumber = require("is_number"),
    Component = require("./component"),
    SpriteManager = require("../component_managers/sprite_manager");


var ComponentPrototype = Component.prototype;


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


Sprite.prototype.construct = function(options) {

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

Sprite.prototype.destructor = function() {

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

Sprite.prototype.setLayer = function(layer) {
    var manager = this.manager;

    if (manager) {
        manager.remove(this);
        this.layer = layer;
        manager.add(this);
        manager.setLayerAsDirty(layer);
    }

    return this;
};

Sprite.prototype.setMaterial = function(material) {
    this.material = material;
    return this;
};

Sprite.prototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    return json;
};

Sprite.prototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    return this;
};
