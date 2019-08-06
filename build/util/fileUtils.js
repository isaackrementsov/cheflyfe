"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
function deleteFile(path) {
    try {
        fs.unlinkSync(path);
    }
    catch (e) { }
}
exports.deleteFile = deleteFile;
//# sourceMappingURL=fileUtils.js.map