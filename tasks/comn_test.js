var comn = require("./comn");


module.exports = function() {
    comn({
        index: "examples/test/src/index.js",
        out: "examples/test/index.min.js"
    });
};
