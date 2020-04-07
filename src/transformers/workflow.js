const qs = require('qs');
const utils = require('../utils.js');

// Search for workflows based on payload and other parameters
/*
 curl  -H "x-auth-organization: FB" "localhost:8081/api/workflow/search?query=status+IN+(FAILED)"
*/
const getSearchBefore = function(tenantId, req) {
    // prefix query with workflowType STARTS_WITH tenantId_
    const originalQueryString = req._parsedUrl.query;
    const parsedQuery = qs.parse(originalQueryString);
    const limitToTenant = 'workflowType STARTS_WITH \'' + tenantId + '_\''
    var q = parsedQuery['query'];
    if (q) {
        // TODO: validate conductor query to prevent security issues
        q = limitToTenant + ' AND (' + q + ')';
    } else {
        q = limitToTenant;
    }
    parsedQuery['query'] = q;
    const newQueryString = qs.stringify(parsedQuery);
    console.log('Transformed query string from', originalQueryString, 'to', newQueryString);
    req.url = req._parsedUrl.pathname + '?' + newQueryString;
}

const getSearchAfter = function(tenantId, req, respObj) {
    const results = respObj['results'];
    // iterate over workflows, remove tenantId
    for (const workflowIdx in results) {
        const workflow = results[workflowIdx];
        utils.removeTenantId(workflow, 'workflowType', tenantId);
    }
}

// Start a new workflow with StartWorkflowRequest, which allows task to be executed in a domain
/*
curl -X POST -H "x-auth-organization: FB" -H "Content-Type: application/json" "localhost:8081/api/workflow" -d '
{
  "name": "fb2",
  "version": 5,
  "correlatonId": "corr1",
  "ownerApp": "my_owner_app",
  "input": {
  }
}
'
*/
const postWorkflowBefore = function(tenantId, req) {
    // name must start with prefix
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const reqObj = req.body;

    // workflowDef section is not allowed (no dynamic workflows)
    if (reqObj.workflowDef) {
        console.error('Section workflowDef is not allowed', reqObj);
        throw 'Section workflowDef is not allowed';
    }
    // taskToDomain section is not allowed
    if (reqObj.taskToDomain) {
        console.error('Section taskToDomain is not allowed', reqObj);
        throw 'Section taskToDomain is not allowed';
    }

    // name should not contain _
    if (reqObj.name.indexOf('_') > -1) {
        console.error('Name must not contain underscore', tenantId, reqObj);
        throw 'Name must not contain underscore'; // TODO create Exception class
    }
    // add prefix
    reqObj.name = tenantWithUnderscore + reqObj.name;
    // add taskToDomain
    reqObj.taskToDomain = {};
    // reqObj.taskToDomain[tenantWithUnderscore + '*'] = tenantId; //TODO: is this OK?
    console.debug('Transformed request to', reqObj);
    return { buffer: utils.createProxyOptionsBuffer(reqObj) };
}

module.exports = {
    register: function(registerFun) {
        registerFun('get',  '/api/workflow/search', getSearchBefore, getSearchAfter);
        registerFun('post', '/api/workflow', postWorkflowBefore, null);
    }
};
