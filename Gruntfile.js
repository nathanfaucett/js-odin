module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                "src/**/*.js"
            ]
        },
        jshint: {
            options: {
                es3: true,
                unused: true,
                curly: true,
                eqeqeq: true,
                expr: true,
                eqnull: true,
                proto: true
            },
            files: [
                "src/**/*.js"
            ]
        },
        comn: {
            test: {
                options: {
                    index: "example/test/src/index.js",
                    out: "example/test/index.min.js"
                }
            }
        },
        watch: {
            options: {
                livereload: 35729
            },
            test_js: {
                files: [
                    "src/**/*.js",
                    "example/test/src/**/*.js"
                ],
                tasks: ["comn:test"],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-comn");

    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-contrib-jshint");

    grunt.registerTask("default", ["jsbeautifier", "jshint"]);

    grunt.registerTask("test", ["comn:test", "watch:test_js"]);
};
