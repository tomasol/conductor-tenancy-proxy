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
                console.log('REQ', req.method, req.url, 'tenantId', tenantId);
                if (entry.beforeFun) {
                    try {
                        var proxyOptions = entry.beforeFun(tenantId, req);
                    }catch (err) {
                        console.error('Got error in beforeFun', err);
                        res.status(500);
                        res.send('Cannot send request: ' + err);
                        return;
                    }
                }
                const _write = res.write; // backup real write method
                // create wrapper that allows transforming output from target
                res.write = function (data) {
                    const respObj = JSON.parse(data);
                    if (entry.afterFun) {
                        entry.afterFun(tenantId, req, respObj, res);
                    }
                    _write.call(res, JSON.stringify(respObj));
                }
                proxy.web(req, res, proxyOptions);
            });
        }
        return router;
    }
}
