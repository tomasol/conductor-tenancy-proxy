const utils = require('../utils.js');
const request = require('request');

// All bulk operations expect json array of workflow Ids in request.
// Each workflow Id must belong to current tenant. Search api is
// used to get all metadata in a single request. If there are no
// validation issues, request is passed to the proxy target.
/*
curl  -H "x-auth-organization: FX" \
    "localhost:8080/api/workflow/bulk/restart" -v -X POST \
    -H "Content-Type: application/json" -d '["381f879d-3225-4605-b1c4-91e1c00f8ab9"]'

curl  -H "x-auth-organization: integrationTestTenant" \
    "localhost:8081/api/workflow/bulk/terminate" -v -X DELETE \
    -H "Content-Type: application/json" -d '["7d40eb5f-6a0d-438d-a35c-3b2111e2744b"]'

*/
const bulkOperationBefore = function (tenantId, req, res, proxyCallback) {
    const requestWorkflowIds = req.body; // expect JS array
    if (!Array.isArray(requestWorkflowIds) || requestWorkflowIds.length == 0) {
        console.error('Expected non empty array, got', requestWorkflowIds);
        res.status(400);
        res.send('Expected array of workflows');
        return;
    }
    // use search api to obtain workflow names
    // Manually encode quotes due to https://github.com/request/request/issues/3181

    // FIXME: query with AND does not limit result as expected
    //const limitToTenant = 'workflowType STARTS_WITH &quot;' + tenantId + '_&quot; AND ';

    var query = 'workflowId+IN+(';

    for (var idx in requestWorkflowIds) {
        const workflowId = requestWorkflowIds[idx];
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
        method: 'GET'
    };
    console.debug('Requesting', requestOptions);
    request(requestOptions, function (error, response, body) {
        console.debug('Got', response.statusCode, body);
        const searchResult = JSON.parse(body);
        // only keep found workflows
        // security - check WorkflowType prefix
        utils.removeTenantPrefix(tenantId, searchResult, 'results[*].workflowType', false);
        const foundWorkflowIds = utils.findValuesByJsonPath(searchResult, 'results[*].workflowId', 'value');

        // for security reasons, make intersection between workflows and validWorkflowIds
        for (var idx = foundWorkflowIds.length - 1; idx >= 0; idx--) {
            const foundWorkflowId = foundWorkflowIds[idx];
            if (requestWorkflowIds.includes(foundWorkflowId) === false) {
                console.warn('ElasticSearch returned workflow that was not requested', foundWorkflowId.workflowId, 'in', requestWorkflowIds);
                foundWorkflowIds.splice(idx, 1);
            }
        }
        console.debug('Sending bulk operation', foundWorkflowIds);
        proxyCallback({ buffer: utils.createProxyOptionsBuffer(foundWorkflowIds, req) });
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
