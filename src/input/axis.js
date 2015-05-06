var mathf = require("mathf");


var AxisPrototype;


module.exports = Axis;


function Axis() {
    this.name = null;

    this.negButton = null;
    this.posButton = null;

    this.altNegButton = null;
    this.altPosButton = null;

    this.gravity = null;
    this.sensitivity = null;

    this.dead = null;

    this.type = null;
    this.axis = null;
    this.index = null;

    this.joyNum = null;

    this.value = null;
}
AxisPrototype = Axis.prototype;

Axis.ButtonType = 1;
Axis.MouseType = 2;
Axis.TouchType = 3;
Axis.WheelType = 4;
Axis.JoystickType = 5;

Axis.create = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, joyNum
) {
    return (new Axis()).construct(
        name,
        negButton, posButton,
        altNegButton, altPosButton,
        gravity, sensitivity, dead, type, axis, index, joyNum
    );
};

AxisPrototype.construct = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, joyNum
) {

    this.name = name != null ? name : "unknown";

    this.negButton = negButton != null ? negButton : "";
    this.posButton = posButton != null ? posButton : "";

    this.altNegButton = altNegButton != null ? altNegButton : "";
    this.altPosButton = altPosButton != null ? altPosButton : "";

    this.gravity = gravity != null ? gravity : 3;
    this.sensitivity = sensitivity != null ? sensitivity : 3;

    this.dead = dead != null ? dead : 0.001;

    this.type = type != null ? type : Axis.ButtonType;
    this.axis = axis != null ? axis : "x";
    this.index = index != null ? index : 0;

    this.joyNum = joyNum != null ? joyNum : 0;

    this.value = 0;

    return this;
};

AxisPrototype.destructor = function() {

    this.name = null;

    this.negButton = null;
    this.posButton = null;

    this.altNegButton = null;
    this.altPosButton = null;

    this.gravity = null;
    this.sensitivity = null;

    this.dead = null;

    this.type = null;
    this.axis = null;
    this.index = null;

    this.joyNum = null;

    this.value = null;

    return this;
};

AxisPrototype.update = function(input, dt) {
    var value = this.value,
        type = this.type,
        sensitivity = this.sensitivity,
        buttons, button, altButton, neg, pos, touch, tmp;

    if (type === Axis.ButtonType) {
        buttons = input.buttons.__hash;

        button = buttons[this.negButton];
        altButton = buttons[this.altNegButton];
        neg = button && button.value || altButton && altButton.value;

        button = buttons[this.posButton];
        altButton = buttons[this.altPosButton];
        pos = button && button.value || altButton && altButton.value;

    } else if (type === Axis.MouseType) {
        this.value = input.mouse.delta[this.axis];
        return this;
    } else if (type === Axis.TouchType) {
        touch = input.touches.__array[this.index];

        if (touch) {
            this.value = touch.delta[this.axis];
        } else {
            return this;
        }
    } else if (type === Axis.WheelType) {
        value += input.mouse.wheel;
    } else if (type === Axis.JoystickType) {
        return this;
    }

    if (neg) {
        value -= sensitivity * dt;
    }
    if (pos) {
        value += sensitivity * dt;
    }

    if (!pos && !neg && value !== 0) {
        tmp = mathf.abs(value);
        value -= mathf.clamp(mathf.sign(value) * this.gravity * dt, -tmp, tmp);
    }

    value = mathf.clamp(value, -1, 1);
    if (mathf.abs(value) <= this.dead) {
        value = 0;
    }

    this.value = value;

    return this;
};

AxisPrototype.fromJSON = function(json) {
    this.name = json.name;

    this.negButton = json.negButton;
    this.posButton = json.posButton;

    this.altNegButton = json.altNegButton;
    this.altPosButton = json.altPosButton;

    this.gravity = json.gravity;
    this.sensitivity = json.sensitivity;

    this.dead = json.dead;

    this.type = json.type;
    this.axis = json.axis;
    this.index = json.index;

    this.joyNum = json.joyNum;

    this.value = json.value;

    return this;
};

AxisPrototype.toJSON = function(json) {

    json = json || {};

    json.name = this.name;

    json.negButton = this.negButton;
    json.posButton = this.posButton;

    json.altNegButton = this.altNegButton;
    json.altPosButton = this.altPosButton;

    json.gravity = this.gravity;
    json.sensitivity = this.sensitivity;

    json.dead = this.dead;

    json.type = this.type;
    json.axis = this.axis;
    json.index = this.index;

    json.joyNum = this.joyNum;

    json.value = this.value;

    return json;
};
