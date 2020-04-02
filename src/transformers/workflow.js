var qs = require('qs');
var utils = require('../utils.js');

var before = function(tenantId, req) {
    // prefix query with workflowType STARTS_WITH tenantId_
    var originalQueryString = req._parsedUrl.query;
    var parsedQuery = qs.parse(originalQueryString);
    var q = parsedQuery['query'];
    var limitToTenant = 'workflowType STARTS_WITH \'' + tenantId + '_\''
    if (q) {
        // TODO: validate query to prevent security issues
        q = limitToTenant + ' AND (' + q + ')';
    } else {
        q = limitToTenant;
    }
    parsedQuery['query'] = q;
    var newQueryString = qs.stringify(parsedQuery);
    console.log('Transformed query string from', originalQueryString, 'to', newQueryString);
    req.url = req._parsedUrl.pathname + '?' + newQueryString;
}

var after = function(tenantId, req, respObj) {
    var results = respObj['results'];
    // iterate over workflows, remove tenantId
    for (var workflowIdx in results) {
        var workflow = results[workflowIdx];
        utils.removeTenantId(workflow, 'workflowType', tenantId);
    }
}

module.exports = {
    register: function(registerFun) {
        registerFun('/api/workflow/search', before, after);
    }
};
