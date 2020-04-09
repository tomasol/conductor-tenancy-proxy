const fs = require('fs');
const path = require('path');

const transformersFolder = path.join(__dirname, 'transformers');

module.exports = {
    init: function (args) {
        // Map of registered transformers keyed by URL path. Value is an array
        // [beforeFun, afterFun] where
        // beforeFun = function(tenantId, req, proxyCallback)
        // afterFun = function(tenantId, req, res, respObj, res)
        // proxyOptions should be called with proxyOptions after beforeFun finished
        var transformers = [];

        var registerFun = function (method, urlPath, beforeFun, afterFun) {
            console.log("Registered", urlPath);
            transformers.push({method, urlPath, beforeFun, afterFun});
        }
        fs.readdirSync(transformersFolder).forEach(file => {
            var transformerPath = path.join(transformersFolder, file);
            console.log('Reading', path.relative(__dirname, transformerPath));
            require(transformerPath).register(registerFun, args);
        });
        return transformers;
    }
}
