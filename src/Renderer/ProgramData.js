module.exports = ProgramData;


function ProgramData() {
    var _this = this;

    this.index = -1;
    this.used = 1;
    this.program = null;
    this.vertex = null;
    this.fragment = null;

    this.onUpdate = function() {
        _this.program.needsUpdate = true;
    };
}
