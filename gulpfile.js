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

gulp.task("min_bones", require("./tasks/uglify")(
    "examples/bones/index.min.js",
    "examples/bones"
));

gulp.task("comn_sprites", function() {
    comn({
        index: "examples/sprites/src/index.js",
        out: "examples/sprites/index.min.js"
    });
});
gulp.task("sprites", require("./tasks/watch")("sprites", ["comn_sprites"]));

gulp.task("min_sprites", require("./tasks/uglify")(
    "examples/sprites/index.min.js",
    "examples/sprites"
));
