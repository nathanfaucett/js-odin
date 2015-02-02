var ComponentManager = require("./component_manager");


module.exports = CameraManager;


function CameraManager() {

    ComponentManager.call(this);
}
ComponentManager.extend(CameraManager, "CameraManager");

CameraManager.prototype.sort = function(a, b) {

    return a.__active ? 1 : (b.__active ? -1 : 0);
};
