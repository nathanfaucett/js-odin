var gulp = require("gulp"),
    livereload = require("gulp-livereload");


module.exports = function(example, tasks) {
    return function() {
        livereload.listen({
            port: 35729
        });

        tasks.push(function() {
            livereload.reload();
        });

        gulp.watch(["src/**/*.js", "examples/"+ example + "/src/**/*.js"], tasks);
    };
};
