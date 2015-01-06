var requestAnimationFrame = require("request_animation_frame");


module.exports = createLoop;


function createLoop(callback, element) {
    var id = null,
        running = false;

    function request() {
        id = requestAnimationFrame(run, element);
    }

    function run(ms) {

        callback(ms);

        if (running) {
            request();
        }
    }

    return {
        run: function() {
            if (running === false) {
                running = true;
                request();
            }
        },
        pause: function() {
            running = false;

            if (id) {
                requestAnimationFrame.cancel(id);
            }
        },
        isRunning: function() {
            return running;
        },
        isPaused: function() {
            return !running;
        }
    };
}
