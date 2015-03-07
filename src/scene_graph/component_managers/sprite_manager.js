var indexOf = require("index_of"),
    ComponentManager = require("./component_manager");


module.exports = SpriteManager;


function SpriteManager() {
    this.scene = null;
    this.__layers = [];
    this.__dirtyLayers = [];
}
ComponentManager.extend(SpriteManager, "SpriteManager");

SpriteManager.prototype.construct = function() {
    return this;
};

SpriteManager.prototype.destructor = function() {

    this.scene = null;
    this.__layers.length = 0;
    this.__dirtyLayers.length = 0;

    return this;
};

SpriteManager.prototype.isEmpty = function() {
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

SpriteManager.prototype.sort = function() {
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

SpriteManager.prototype.sortLayer = function(index) {
    var layer = this.__layers[index];

    if (layer && layer.length !== 0) {
        layer.sort(this.sortFunction);
    }

    return this;
};

SpriteManager.prototype.sortFunction = function(a, b) {
    return a.z - b.z;
};

SpriteManager.prototype.setLayerAsDirty = function(layer) {
    this.__dirtyLayers[layer] = true;
    return this;
};

function init(component) {
    component.awake();
}
SpriteManager.prototype.init = function() {
    this.forEach(init);
    return this;
};

function awake(component) {
    component.awake();
}
SpriteManager.prototype.awake = function() {
    this.forEach(awake);
    return this;
};

SpriteManager.prototype.update = function() {
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

SpriteManager.prototype.forEach = function(callback) {
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

SpriteManager.prototype.has = function(component) {
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

SpriteManager.prototype.add = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer] || (layers[componentLayer] = []),
        index = indexOf(layer, component);

    if (index === -1) {
        layer[layer.length] = component;
    }

    return this;
};

SpriteManager.prototype.remove = function(component) {
    var layers = this.__layers,
        componentLayer = component.layer,
        layer = layers[componentLayer],
        index = layer ? indexOf(layer, component) : -1;

    if (index !== -1) {
        layer.splice(index, 1);
    }

    return this;
};
