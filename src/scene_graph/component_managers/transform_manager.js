var ComponentManager = require("./component_manager");


module.exports = TransformManager;


function TransformManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(TransformManager, "TransformManager", -9999);

TransformManager.prototype.sortFunction = function(a, b) {

    return a.sceneObject.depth - b.sceneObject.depth;
};
