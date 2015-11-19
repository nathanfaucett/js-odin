var ComponentManager = require("./index");


var TransformManagerPrototype;


module.exports = TransformManager;


function TransformManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(TransformManager, "odin.TransformManager", 9999);
TransformManagerPrototype = TransformManager.prototype;

TransformManagerPrototype.sortFunction = function(a, b) {
    return a.entity.depth - b.entity.depth;
};
