var indexOf = require("index_of"),
    ComponentManager = require("./index");


var SpriteManagerPrototype;


module.exports = SpriteManager;


function SpriteManager() {
    this.scene = null;
    this.__layers = [];
    this.__dirtyLayers = [];
}
ComponentManager.extend(SpriteManager, "odin.SpriteManager");
SpriteManagerPrototype = SpriteManager.prototype;

SpriteManagerPrototype.construct = function() {
    return this;
};

SpriteManagerPrototype.destructor = function() {

    this.scene = null;
    this.__layers.length = 0;
    this.__dirtyLayers.length = 0;

    return this;
};

SpriteManagerPrototype.isEmpty = function() {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer;

    while (i++ < il) {
        layer = layers[i];

        if (layer && layer.length !== 0) {
            return false;
        }
    }

    return true;
};

SpriteManagerPrototype.sort = function() {
    var sortFunction = this.sortFunction,
        layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer;

    while (i++ < il) {
        layer = layers[i];

        if (layer && layer.length !== 0) {
            layer.sort(sortFunction);
        }
    }

    return this;
};

SpriteManagerPrototype.sortLayer = function(index) {
    var layer = this.__layers[index];

    if (layer && layer.length !== 0) {
        layer.sort(this.sortFunction);
    }

    return this;
};

SpriteManagerPrototype.sortFunction = function(a, b) {
    return a.z - b.z;
};

SpriteManagerPrototype.setLayerAsDirty = function(layer) {
    this.__dirtyLayers[layer] = true;
    return this;
};

function init(component) {
    component.awake();
}
SpriteManagerPrototype.init = function() {
    this.forEach(init);
    return this;
};

function awake(component) {
    component.awake();
}
SpriteManagerPrototype.awake = function() {
    this.forEach(awake);
    return this;
};

SpriteManagerPrototype.update = function() {
    var layers = this.__layers,
        dirtyLayers = this.__dirtyLayers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            if (dirtyLayers[i]) {
                this.sortLayer(i);
                dirtyLayers[i] = false;
            }

            j = -1;
            while (j++ < jl) {
                layer[j].update();
            }
        }
    }

    return this;
};

SpriteManagerPrototype.forEach = function(callback) {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            j = -1;
            while (j++ < jl) {
                if (callback(layer[j], j) === false) {
                    return false;
                }
            }
        }
    }

    return true;
};

SpriteManagerPrototype.has = function(component) {
    var layers = this.__layers,
        i = -1,
        il = layers.length - 1,
        layer, j, jl;

    while (i++ < il) {
        layer = layers[i];

        if (layer && (jl = layer.length - 1) !== -1) {
            j = -1;
            while (j++ < jl) {
                if (component === layer[j]) {
                    return true;
                }
            }
        }
    }

    return false;
};

SpriteManagerPrototype.addComponent = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer] || (layers[componentLayer] = []),
        index = indexOf(layer, component);

    if (index === -1) {
        layer[layer.length] = component;
    }

    return this;
};

SpriteManagerPrototype.removeComponent = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer],
        index = layer ? indexOf(layer, component) : -1;

    if (index !== -1) {
        layer.splice(index, 1);
    }

    return this;
};
