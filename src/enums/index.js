var extend = require("extend"),
    WebGLContext = require("webgl_context");


var enums = extend(exports, WebGLContext.enums);


enums.side = require("./side");
enums.wrapMode = require("./wrapMode");
