var gulp = require("gulp"),
    uglify = require("gulp-uglify");


module.exports = minjs;


function minjs(src, dest) {
    return function() {
        return (
            gulp.src(src)
                .pipe(uglify())
                .pipe(gulp.dest(dest))
        );
    };
}
