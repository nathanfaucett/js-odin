var gulp = require("gulp"),
    jshint = require("gulp-jshint");


module.exports = function() {
  return gulp.src("src/**/*.js")
    .pipe(jshint({
        es3: true,
        unused: true,
        curly: true,
        eqeqeq: true,
        expr: true,
        eqnull: true,
        proto: true
    }))
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"));
};
