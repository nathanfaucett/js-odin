var comn = require("comn"),
    fileUtils = require("file_utils");


module.exports = function(options) {
    try{
        fileUtils.writeFileSync(options.out, comn(options.index || options.main || options.file, options));
    } catch(e) {
        console.log(e);
    }
};
