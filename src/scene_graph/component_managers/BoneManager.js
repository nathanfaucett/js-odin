var ComponentManager = require("./ComponentManager");


var BoneManagerPrototype;


module.exports = BoneManager;


function BoneManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(BoneManager, "BoneManager", 10000);
BoneManagerPrototype = BoneManager.prototype;

BoneManagerPrototype.sortFunction = function(a, b) {
    return a.parentIndex - b.parentIndex;
};
