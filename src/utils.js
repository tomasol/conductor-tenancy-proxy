module.exports = {
    getTenantId: function (req) {
        var result = req.headers['x-auth-organization'];
        if (result == null) {
            throw 'x-auth-organization header not found';
        }
        if (/^[a-z0-9]+$/i.test(result)) {
            return result;
        }
        console.error('TenantId must be alphanumeric', result);
        throw 'TenantId must be alphanumeric';
    },
    removeTenantId: function (obj, attr, tenantId) {
        var value = obj[attr];
        if (value.indexOf(tenantId + "_") == 0) {
            obj[attr] = value.substr((tenantId + '_').length);
        }
        else {
            console.error('TenantId', tenantId, 'not found', obj);
            throw 'TenantId prefix not found in value';
        }
    }
}
