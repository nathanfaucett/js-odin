var mathf = require("mathf"),
    isNullOrUndefined = require("is_null_or_undefined"),
    axis = require("../enums/axis");


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

    this.gamepadIndex = null;

    this.value = null;
}
AxisPrototype = Axis.prototype;

Axis.create = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, gamepadIndex
) {
    return (new Axis()).construct(
        name,
        negButton, posButton,
        altNegButton, altPosButton,
        gravity, sensitivity, dead, type, axis, index, gamepadIndex
    );
};

AxisPrototype.construct = function(
    name,
    negButton, posButton,
    altNegButton, altPosButton,
    gravity, sensitivity, dead, type, axis, index, gamepadIndex
) {

    this.name = isNullOrUndefined(name) ? "unknown" : name;

    this.negButton = isNullOrUndefined(negButton) ? "" : negButton;
    this.posButton = isNullOrUndefined(posButton) ? "" : posButton;

    this.altNegButton = isNullOrUndefined(altNegButton) ? "" : altNegButton;
    this.altPosButton = isNullOrUndefined(altPosButton) ? "" : altPosButton;

    this.gravity = isNullOrUndefined(gravity) ? 3 : gravity;
    this.sensitivity = isNullOrUndefined(sensitivity) ? 3 : sensitivity;

    this.dead = isNullOrUndefined(dead) ? 0.001 : dead;

    this.type = isNullOrUndefined(type) ? Axis.ButtonType : type;
    this.axis = isNullOrUndefined(axis) ? 0 : axis;
    this.index = isNullOrUndefined(index) ? 0 : index;

    this.gamepadIndex = isNullOrUndefined(gamepadIndex) ? 0 : gamepadIndex;

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

    this.gamepadIndex = null;

    this.value = null;

    return this;
};

AxisPrototype.update = function(input, dt) {
    var value = this.value,
        type = this.type,
        sensitivity = this.sensitivity,
        buttons, button, altButton, neg, pos, touch, gamepad, tmp;

    if (type === axis.BUTTON) {
        buttons = input.buttons.__hash;

        button = buttons[this.negButton];
        altButton = buttons[this.altNegButton];
        neg = button && button.pressed || altButton && altButton.pressed;

        button = buttons[this.posButton];
        altButton = buttons[this.altPosButton];
        pos = button && button.pressed || altButton && altButton.pressed;

    } else if (type === axis.MOUSE) {
        this.value = input.mouse.delta[this.axis] || 0.0;
        return this;
    } else if (type === axis.TOUCH) {
        touch = input.touches.__array[this.index];

        if (touch) {
            this.value = touch.delta[this.axis] || 0.0;
            return this;
        } else {
            return this;
        }
    } else if (type === axis.WHEEL) {
        value += input.mouse.wheel;
    } else if (type === axis.GAMEPAD) {
        gamepad = input.gamepads.__array[this.gamepadIndex];

        if (gamepad) {
            tmp = gamepad.axes[(this.index * 2) + this.axis];

            value = tmp ? tmp.value : 0.0;
            value = mathf.clamp(value, -1.0, 1.0);

            if (mathf.abs(value) <= this.dead) {
                value = 0.0;
            }

            this.value = value;
            return this;
        } else {
            return this;
        }
    }

    if (neg) {
        value -= sensitivity * dt;
    }
    if (pos) {
        value += sensitivity * dt;
    }

    if (!pos && !neg && value !== 0.0) {
        tmp = mathf.abs(value);
        value -= mathf.clamp(mathf.sign(value) * this.gravity * dt, -tmp, tmp);
    }

    value = mathf.clamp(value, -1.0, 1.0);
    if (mathf.abs(value) <= this.dead) {
        value = 0.0;
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

    this.gamepadIndex = json.gamepadIndex;

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

    json.gamepadIndex = this.gamepadIndex;

    json.value = this.value;

    return json;
};
