const streamify = require('stream-array');
const {JSONPath} = require('jsonpath-plus');

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

    // TODO: deprecated, use this.removeTenantPrefix
    removeTenantId: function (json, attr, tenantId) {
        this.removeTenantPrefix(tenantId, json, attr, false);
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
    },

    removeTenantPrefix: function (tenantId, json, jsonPath, allowGlobal) {
        const tenantWithUnderscore = this.withUnderscore(tenantId);
        const globalPrefix = this.withUnderscore(this.GLOBAL_PREFIX);
        const result = JSONPath({ path: jsonPath, json: json, resultType: 'all' });
        console.debug('For path', jsonPath, 'found', result.length, 'items');
        for (var idx in result) {
            const item = result[idx];
            const prop = item.parent[item.parentProperty];
            if (allowGlobal && prop.indexOf(globalPrefix) == 0) {
                continue;
            }
            // expect tenantId prefix
            if (prop.indexOf(tenantWithUnderscore) != 0) {
                console.error('Name must not contain underscore', tenantId, json, jsonPath, item);
                throw 'Name must not contain underscore'; // TODO create Exception class
            }
            // remove prefix
            item.parent[item.parentProperty] = prop.substr(tenantWithUnderscore.length);
        }
    },

    removeTenantPrefixes: function (tenantId, json, jsonPathToAllowGlobal) {
        for (var key in jsonPathToAllowGlobal) {
            this.removeTenantPrefix(tenantId, json, key, jsonPathToAllowGlobal[key]);
        }
    }
}
