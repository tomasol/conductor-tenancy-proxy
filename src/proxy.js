const Router = require("express");
const httpProxy = require('http-proxy');
const utils = require('./utils.js');

const router = new Router();

module.exports = {
    configure: function (transformers, proxyTarget) {
        // Configure http-proxy
        const proxy = httpProxy.createProxyServer({
            target: proxyTarget
        });

        for (const idx in transformers) {
            const entry = transformers[idx];
            console.log('Routing', entry.urlPath, entry.method);
            router[entry.method](entry.urlPath, async (req, res, next) => {
                try {
                    var tenantId = utils.getTenantId(req);
                } catch (err) {
                    res.status(400);
                    res.send('Cannot get tenantId:' + err);
                    return;
                }
                // prepare 'after'
                const _write = res.write; // backup real write method
                // create wrapper that allows transforming output from target
                res.write = function (data) {
                    if (entry.afterFun) {
                        // TODO: parse only if data is json
                        var respObj = JSON.parse(data);
                        entry.afterFun(tenantId, req, respObj, res);
                        data = JSON.stringify(respObj);
                    }
                    _write.call(res, data);
                }

                // start with 'before'
                console.log('REQ', req.method, req.url, 'tenantId', tenantId);
                const proxyCallback = function(proxyOptions) {
                    proxy.web(req, res, proxyOptions);
                };
                if (entry.beforeFun) {
                    delete req.headers['content-length']; // fix content length changes
                    try {
                        entry.beforeFun(tenantId, req, res, proxyCallback);
                    } catch (err) {
                        console.error('Got error in beforeFun', err);
                        res.status(500);
                        res.send('Cannot send request: ' + err);
                        return;
                    }
                } else {
                    proxyCallback();
                }
            });
        }
        return router;
    }
}
