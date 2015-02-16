var ComponentManager = require("./component_manager");


module.exports = MeshManager;


function MeshManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(MeshManager, "MeshManager");

MeshManager.prototype.sortFunction = function(a, b) {
    return a.geometry !== b.geometry ? 1 : (a.material !== b.material ? 1 : 0);
};
