var gulp = require("gulp"),
    jsbeautifier = require("gulp-jsbeautifier");


module.exports = function() {
    gulp.src(["src/**/*.js"])
        .pipe(jsbeautifier())
        .pipe(gulp.dest("src"));
};
