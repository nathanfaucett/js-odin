var ComponentManager = require("./component_manager");


var TransformManagerPrototype;


module.exports = TransformManager;


function TransformManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(TransformManager, "TransformManager", 9999);
TransformManagerPrototype = TransformManager.prototype;

TransformManagerPrototype.sortFunction = function(a, b) {
    return a.sceneObject.depth - b.sceneObject.depth;
};
