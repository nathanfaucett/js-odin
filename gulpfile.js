var gulp = require("gulp"),
    comn = require("./tasks/comn"),
    jshint = require("gulp-jshint");


gulp.task("default", ["jsbeautifier", "jshint"]);

gulp.task("jshint", require("./tasks/jshint"));
gulp.task("jsbeautifier", require("./tasks/jsbeautifier"));

gulp.task("comn_bones", function() {
    comn({
        index: "examples/bones/src/index.js",
        out: "examples/bones/index.min.js"
    });
});

gulp.task("bones", require("./tasks/watch")("bones", ["comn_bones"]));
