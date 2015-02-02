var ComponentManager = require("./component_manager");


module.exports = MeshManager;


function MeshManager() {
    ComponentManager.call(this);
}
ComponentManager.extend(MeshManager, "MeshManager");
