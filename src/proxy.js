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

        for (const urlPath in transformers) {
            console.log('Routing', 'GET', urlPath); // TODO support POST
            const beforeFun = transformers[urlPath][0];
            const afterFun = transformers[urlPath][1];
            // TODO: support POST
            router.get(urlPath, async (req, res, next) => {
                try {
                    var tenantId = utils.getTenantId(req);
                } catch (err) {
                    res.status(400);
                    res.send('Cannot get tenantId:' + err);
                }
                console.log('REQ', req.url, 'tenantId', tenantId);
                beforeFun(tenantId, req);
                var _write = res.write;
                res.write = function (data) {
                    var respObj = JSON.parse(data);
                    afterFun(tenantId, req, respObj);
                    _write.call(res, JSON.stringify(respObj));
                }
                proxy.web(req, res);
            });
        }
        return router;
    }
}
