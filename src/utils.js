const streamify = require('stream-array');

module.exports = {

    GLOBAL_PREFIX: 'GLOBAL',

    withUnderscore(s) {
        return s + '_';
    },

    getTenantId: function (req) {
        var result = req.headers['x-auth-organization'];
        if (result == null) {
            throw 'x-auth-organization header not found';
        }
        if (/^[a-z0-9]+$/i.test(result) == false) {
            console.error('TenantId must be alphanumeric', result);
            throw 'TenantId must be alphanumeric';
        }
        if (result == this.GLOBAL_PREFIX) {
            console.error('Illegal name for TenantId', result);
            throw 'Illegal TenantId';
        }
        return result;
    },

    removeTenantId: function (obj, attr, tenantId) {
        const value = obj[attr];
        const tenantWithU = this.withUnderscore(tenantId);
        if (value.indexOf(tenantWithU) == 0) {
            obj[attr] = value.substr((tenantWithU).length);
        }
        else {
            console.error('TenantId', tenantId, 'not found', obj);
            throw 'TenantId prefix not found in value';
        }
    },

    createProxyOptionsBuffer: function (modifiedBody) {
        // if request transformer returned modified body,
        // serialize it to new request stream. Original
        // request stream was already consumed. See `buffer` option
        // in node-http-proxy.
        if (typeof modifiedBody === 'object') {
            modifiedBody = JSON.stringify(modifiedBody);
        }
        if (typeof modifiedBody === 'string') {
            modifiedBody = [modifiedBody];
        }
        return streamify(modifiedBody);
    }
}
