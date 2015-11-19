var extend = require("extend"),
    WebGLContext = require("webgl_context");


var enums = extend(exports, WebGLContext.enums);


enums.axis = require("./axis");
enums.emitterRenderMode = require("./emitterRenderMode");
enums.interpolation = require("./interpolation");
enums.normalMode = require("./normalMode");
enums.screenAlignment = require("./screenAlignment");
enums.side = require("./side");
enums.sortMode = require("./sortMode");
enums.wrapMode = require("./wrapMode");
