var time = require("time");


module.exports = Time;


function Time() {
    var _this = this,
        scale = 1,
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

    this.time = 0;
    this.fps = 60;
    this.delta = 1 / 60;
    this.frameCount = 0;

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

        _this.time = current * _this.scale;
    };

    Object.defineProperty(this, "scale", {
        enumerable: true,
        configurable: false,

        get: function() {
            return scale;
        },
        set: function(value) {
            scale = value;
            fixedDelta = globalFixed * value;
        }
    });

    Object.defineProperty(this, "fixedDelta", {
        enumerable: true,
        configurable: false,

        get: function() {
            return fixedDelta;
        },
        set: function(value) {
            globalFixed = value;
            fixedDelta = globalFixed * scale;
        }
    });
}

Time.create = function() {
    return new Time();
};

Object.defineProperty(Time.prototype, "sinceStart", {
    enumerable: true,
    configurable: false,
    get: function() {
        return time.now();
    }
});

Object.defineProperty(Time.prototype, "start", {
    enumerable: true,
    configurable: false,
    writable: false,
    value: time.stamp()
});

Time.prototype.now = function() {
    return time.now() * 0.001;
};

Time.prototype.stamp = function() {
    return time.stamp() * 0.001;
};
