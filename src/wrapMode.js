var enums = require("enums");


var wrapMode = enums([
    "ONCE",
    "LOOP",
    "PING_PONG",
    "CLAMP"
]);


module.exports = wrapMode;
