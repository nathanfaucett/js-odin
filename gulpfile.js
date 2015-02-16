var gulp = require("gulp"),
    jshint = require("gulp-jshint");


gulp.task("default", ["jsbeautifier", "jshint"]);

gulp.task("jshint", require("./tasks/jshint"));
gulp.task("jsbeautifier", require("./tasks/jsbeautifier"));

gulp.task("comn_test", require("./tasks/comn_test"));

gulp.task("test", require("./tasks/watch")("test", ["comn_test"]));
