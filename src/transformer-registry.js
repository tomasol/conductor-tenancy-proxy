const fs = require('fs');
const path = require('path');

const transformersFolder = path.join(__dirname, 'transformers');

module.exports = {
    init: function () {
        // Map of registered transformers keyed by URL path. Value is an array
        // [beforeFun, afterFun] where
        // beforeFun = function(tenantId, req)
        // afterFun = function(tenantId, req, respObj)
        var transformers = {};

        var registerFun = function (path, beforeFun, afterFun) {
            console.log("Registered", path);
            transformers[path] = [beforeFun, afterFun];
        }
        fs.readdirSync(transformersFolder).forEach(file => {
            var transformerPath = path.join(transformersFolder, file);
            console.log('Reading', path.relative(__dirname, transformerPath));
            require(transformerPath).register(registerFun);
        });
        return transformers;
    }
}
