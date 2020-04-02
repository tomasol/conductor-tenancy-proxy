const connect = require('connect');
const http = require('http');
const httpProxy = require('http-proxy');
var utils = require('./utils.js');

module.exports = {
    startProxy: function (transformers, listeningAddress, proxyTarget) {
        // Configure http-proxy
        const proxy = httpProxy.createProxyServer({
            target: proxyTarget
        });
        // Configure connect app
        var app = connect();
        // handler that runs transformers or throws exception when transformer is not found
        app.use(function (req, res, next) {
            var tenantId = utils.getTenantId(req); // TODO proper status code on exception
            var path = req._parsedUrl.pathname;
            // locate transformer from the registry
            var found = transformers[path];
            console.log('REQ', req.url, 'tenantId', tenantId);
            if (found) {
                var beforeFun = found[0];
                beforeFun(tenantId, req);
                var _write = res.write;
                res.write = function (data) {
                    var respObj = JSON.parse(data);
                    var afterFun = found[1];
                    afterFun(tenantId, req, respObj);
                    _write.call(res, JSON.stringify(respObj));
                }
                proxy.web(req, res);
            } else {
                console.log('Path not found', path);
                // TODO proper status code
                throw 'Path not found';
            }
        });
        // Start HTTP server
        var result = http.createServer(app).listen(listeningAddress);
        console.log('Listening on', listeningAddress, ', proxy target', proxyTarget);
        return result;

    }
}
