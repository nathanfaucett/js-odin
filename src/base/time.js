var time = require("time");


module.exports = Time;


function Time() {
    var _this = this,
        scale = 1,

        START = time.now() * 0.001,

        globalFixed = 1 / 60,
        fixedDelta = 1 / 60,

        frameCount = 0,
        last = -1 / 60,
        current = 0,
        delta = 1 / 60,
        fpsFrame = 0,
        fpsLast = 0,

        MIN_DELTA = 0.000001,
        MAX_DELTA = 1;

    this.time = START;
    this.fps = 60;
    this.delta = 1 / 60;
    this.frameCount = 0;

    this.now = function() {
        return (time.now() * 0.001) - START;
    };

    this.start = function() {
        return START;
    };

    this.update = function() {
        _this.frameCount = frameCount++;

        last = _this.time;
        current = _this.now();

        fpsFrame++;
        if (fpsLast + 1000 < current) {
            _this.fps = fpsFrame / (current - fpsLast);

            fpsLast = current;
            fpsFrame = 0;
        }

        delta = (current - last) * _this.scale;
        _this.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

        _this.time = current;
    };

    this.scale = scale;
    this.setScale = function(value) {
        this.scale = value;
        this.fixedDelta = globalFixed * value;
    };

    this.fixedDelta = fixedDelta;
    this.setFixedDelta = function(value) {
        globalFixed = value;
        this.fixedDelta = globalFixed * scale;
    };
}

Time.create = function() {
    return new Time();
};

Time.prototype.stamp = function() {
    return time.stamp() * 0.001;
};
