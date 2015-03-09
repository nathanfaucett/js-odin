var createPool = require("create_pool"),
    keyCodes = require("./key_codes");


module.exports = KeyEvent;


function KeyEvent(e) {
    var keyCode = e.keyCode;

    this.type = e.type;
    this.key = keyCodes[keyCode];
    this.keyCode = keyCode;
}
createPool(KeyEvent);

KeyEvent.create = function(e) {
    return KeyEvent.getPooled(e);
};

KeyEvent.prototype.destroy = function() {
    KeyEvent.release(this);
};

KeyEvent.prototype.destructor = function() {
    this.type = null;
    this.key = null;
    this.keyCode = null;
};
