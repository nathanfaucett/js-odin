var keyMirror = require("key_mirror");


var wrapMode = keyMirror([
    "Once",
    "Loop",
    "PingPong",
    "Clamp"
]);


module.exports = wrapMode;
