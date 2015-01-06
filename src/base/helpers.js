var time = require("time"),
    helpers = module.exports,
    reMatcher = /[^A-Z-_ \.]+|[A-Z][^A-Z-_ \.]+|[^a-z-_ \.]+/g;


function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
}


helpers.camelize = function(str, lowFirstLetter) {
    var parts = str.match(reMatcher),
        i = parts.length;

    while (i--) {
        parts[i] = capitalize(parts[i]);
    }

    str = parts.join("");

    return lowFirstLetter !== false ? str[0].toLowerCase() + str.slice(1) : str;
};

helpers.timer = function() {
    var start = time.now();

    return {
        delta: function() {
            return time.now() - start;
        },
        reset: function() {
            start = time.now();
        }
    };
};
