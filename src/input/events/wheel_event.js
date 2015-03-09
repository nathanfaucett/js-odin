var createPool = require("create_pool");


module.exports = WheelEvent;


function WheelEvent(e) {
    this.type = e.type;
    this.deltaX = getDeltaX(e);
    this.deltaY = getDeltaY(e);
    this.deltaZ = e.deltaZ;
}
createPool(WheelEvent);

WheelEvent.create = function(e) {
    return WheelEvent.getPooled(e);
};

WheelEvent.prototype.destroy = function() {
    WheelEvent.release(this);
};

WheelEvent.prototype.destructor = function() {
    this.type = null;
    this.deltaX = null;
    this.deltaY = null;
    this.deltaZ = null;
};

function getDeltaX(e) {
    return e.deltaX != null ? e.deltaX : (
        e.wheelDeltaX != null ? -e.wheelDeltaX : 0
    );
}

function getDeltaY(e) {
    return e.deltaY != null ? e.deltaY : (
        e.wheelDeltaY != null ? -e.wheelDeltaY : (
            e.wheelDelta != null ? -e.wheelDelta : 0
        )
    );
}
