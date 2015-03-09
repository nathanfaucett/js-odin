var MouseEvent = require("./mouse_event"),
    WheelEvent = require("./wheel_event"),
    KeyEvent = require("./key_event"),
    TouchEvent = require("./touch_event"),
    DeviceMotionEvent = require("./device_motion_event");


module.exports = {
    mousedown: MouseEvent,
    mouseup: MouseEvent,
    mousemove: MouseEvent,
    mouseout: MouseEvent,

    wheel: WheelEvent,

    keyup: KeyEvent,
    keydown: KeyEvent,

    touchstart: TouchEvent,
    touchmove: TouchEvent,
    touchend: TouchEvent,
    touchcancel: TouchEvent,

    devicemotion: DeviceMotionEvent
};
