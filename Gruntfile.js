module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                "**/*.js",
                "!**/*.min.js",
                "!**/node_modules/**/*"
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
                "**/*.js",
                "!odin.js",
                "!odin.min.js",
                "!**/node_modules/**/*"
            ]
        },
        uglify: {
            compile: {
                options: {
                    mangle: true
                },
                files: {
                    "odin.min.js": [
                        "odin.js"
                    ]
                }
            }
        },
        comn: {
            compile: {
                index: "./src/index.js",
                out: "odin.js",
                exportName: "odin"
            }
        },
        watch: {
            options: {
                livereload: 35729
            },
            js: {
                files: [
                    "src/**/*.js",
                    "example/**/*.js"
                ],
                tasks: ["comn"],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.registerMultiTask("comn", "compile js files", function() {
        var comn = require("comn"),
            data = this.data;

        comn.compile(data.index, data.out, {
            exportName: data.exportName
        });
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.registerTask("default", ["jsbeautifier", "jshint"]);

    grunt.registerTask("build", ["comn", "uglify"]);
};
