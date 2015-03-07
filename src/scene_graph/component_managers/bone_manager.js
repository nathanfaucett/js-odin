var ComponentManager = require("./component_manager");


module.exports = BoneManager;


function BoneManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(BoneManager, "BoneManager", 10000);

BoneManager.prototype.sortFunction = function(a, b) {
    return a.parentIndex - b.parentIndex;
};
