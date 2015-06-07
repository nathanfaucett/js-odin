var enums = require("enums");


var sortMode = enums([
    "NONE",
    "VIEW_PROJ_DEPTH",
    "DISTANCE_TO_VIEW",
    "AGE_OLDEST_FIRST",
    "AGE_NEWEST_FIRST"
]);


module.exports = sortMode;
