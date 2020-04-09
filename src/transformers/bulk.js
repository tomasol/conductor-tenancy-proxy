const utils = require('../utils.js');
const request = require('request');

// All bulk operations expect json array of workflow Ids in request.
// Each workflow Id must belong to current tenant. Search api is
// used to get all metadata in a single request. If there are no
// validation issues, request is passed to the proxy target.
/*
curl  -H "x-auth-organization: FB" \
    "localhost:8080/api/workflow/bulk/restart" -v -X POST \
    -H "Content-Type: application/json" -d '["381f879d-3225-4605-b1c4-91e1c00f8ab9"]'
*/
const bulkOperationBefore = function (tenantId, req, res, proxyCallback) {
    const workflows = req.body; // expect JS array
    if (!Array.isArray(workflows) || workflows.length == 0) {
        console.error('Expected non empty array, got', workflows);
        res.status(400);
        res.send('Expected array of workflows');
        return;
    }
    // use search api to obtain workflow names
    const limitToTenant = 'workflowType STARTS_WITH \'' + tenantId + '_\''

    var query = limitToTenant + ' AND workflowId IN (';
    for (var idx in workflows) {
        const workflowId = workflows[idx];
        // TODO: sanitize using regex
        if (/^[a-z0-9\-]+$/i.test(workflowId)) {
            query += workflowId + ',';
        }
    }
    query += ')';
    const queryUrl = proxyTarget + '/api/workflow/search?query=' + query;
    // first make a HTTP request to validate that all workflows belong to tenant
    const requestOptions = {
        url: queryUrl,
        method: 'GET',
        headers: {
            'Content-Type': 'application/javascript'
        }
    };
    console.debug('Requesting', requestOptions);
    request(requestOptions, function (error, response, body) {
        console.debug('Got', response.statusCode, body);
        const workflows = JSON.parse(body);
        // only keep found workflows
        const validWorkflowIds = utils.findValuesByJsonPath(workflows, 'results[*].workflowId', 'value');
        console.debug('Continuing', validWorkflowIds);
        proxyCallback({ buffer: utils.createProxyOptionsBuffer(validWorkflowIds) });

    });
}


var proxyTarget;

module.exports = {
    register: function (registerFun, _proxyTarget) {
        proxyTarget = _proxyTarget;
        registerFun('delete', '/api/workflow/bulk/terminate', bulkOperationBefore, null);
        registerFun('put',    '/api/workflow/bulk/pause',     bulkOperationBefore, null);
        registerFun('put',    '/api/workflow/bulk/resume',    bulkOperationBefore, null);
        registerFun('post',   '/api/workflow/bulk/retry',     bulkOperationBefore, null);
        registerFun('post',   '/api/workflow/bulk/restart',   bulkOperationBefore, null);
    }
};
