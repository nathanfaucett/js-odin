var createPool = require("create_pool");


module.exports = DeviceMotionEvent;


function DeviceMotionEvent(e) {
    this.type = e.type;
    this.accelerationIncludingGravity = e.accelerationIncludingGravity;
}
createPool(DeviceMotionEvent);

DeviceMotionEvent.create = function(e) {
    return DeviceMotionEvent.getPooled(e);
};

DeviceMotionEvent.prototype.destroy = function() {
    DeviceMotionEvent.release(this);
};

DeviceMotionEvent.prototype.destructor = function() {
    this.type = null;
    this.accelerationIncludingGravity = null;
};
