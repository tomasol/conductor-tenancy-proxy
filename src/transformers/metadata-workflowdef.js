// Currently just filters result without passing prefix to conductor.
// TODO: implement querying by prefix in conductor

const utils = require('../utils.js');
const qs = require('qs');

// Utility used in PUT, POST before methods to check that submitted workflow and its tasks
// do not contain any prefix. Prefix is added to workflowdef if input is valid.
const sanitizeWorkflowdefBefore = function (workflowdef, tenantWithUnderscore) {
    if (workflowdef.name.indexOf('_') == -1) {
        // validate tasks
        for (var taskIdx in workflowdef.tasks) {
            const task = workflowdef.tasks[taskIdx];
            if (task.name.indexOf(utils.withUnderscore(utils.GLOBAL_PREFIX)) == 0) {
                // noop on GLOBAL_ tasks
            } else if (task.name.indexOf('_') == -1) {
                // noop on unprefixed tasks
            } else {
                console.error('Name must not contain underscore', tenantId, reqObj);
                throw 'Name must not contain underscore'; // TODO create Exception class
            }
        }
        // add prefix to tasks
        for (var taskIdx in workflowdef.tasks) {
            const task = workflowdef.tasks[taskIdx];
            // if task does not start with GLOBAL_ prefix...
            if (task.name.indexOf(utils.withUnderscore(utils.GLOBAL_PREFIX)) != 0) {
                // add tenantId prefix
                task.name = tenantWithUnderscore + task.name;
            }
        }
        // add prefix to workflow
        workflowdef.name = tenantWithUnderscore + workflowdef.name;
    } else {
        console.error('Name must not contain underscore', tenantId, reqObj);
        throw 'Name must not contain underscore'; // TODO create Exception class
    }
}

// Utility used after getting single or all workflowdefs to remove prefix from
// workflowdef names, taskdef names.
// Return true iif sanitization succeeded, false iif this workflowdef is invalid.
const sanitizeWorkflowdefAfter = function(tenantId, workflowdef) {
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    if (workflowdef.name.indexOf(tenantWithUnderscore) == 0) {
        // keep only workflows with correct taskdefs,
        // allowed are GLOBAL and those with tenantId prefix which will be removed
        for (var taskIdx in workflowdef.tasks) {
            const task = workflowdef.tasks[taskIdx];
            if (task.name.indexOf(utils.withUnderscore(utils.GLOBAL_PREFIX)) == 0) {
                // noop
            } else if (task.name.indexOf(tenantWithUnderscore) == 0) {
                // remove prefix
                task.name = task.name.substr(tenantWithUnderscore.length);
            } else {
                return false;
            }
        }
        // remove prefix
        workflowdef.name = workflowdef.name.substr(tenantWithUnderscore.length);
        return true;
    } else {
        return false;
    }
}


// Retrieves all workflow definition along with blueprint
/*
curl -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow"
*/
const getAllWorkflowsAfter = function (tenantId, req, respObj) {
    // iterate over workflows, keep only those belonging to tenantId
    for (var workflowIdx = respObj.length - 1; workflowIdx >= 0; workflowIdx--) {
        const workflowdef = respObj[workflowIdx];
        const ok = sanitizeWorkflowdefAfter(tenantId, workflowdef, respObj);
        if (!ok) {
            console.warn('Removing workflow with invalid task or name', workflowdef);
            // remove element
            respObj.splice(workflowIdx, 1);
        }
    }
}

// Removes workflow definition. It does not remove workflows associated with the definition.
// Version is passed as url parameter.
/*
curl -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow/2/2" -X DELETE
*/
const deleteWorkflowBefore = function (tenantId, req, res, proxyCallback) {
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    // change URL: add prefix to name
    const name = tenantWithUnderscore + req.params.name;
    const newUrl = `/api/metadata/workflow/${name}/${req.params.version}`;
    console.log('Transformed url from', req.url, 'to', newUrl);
    req.url = newUrl;
    proxyCallback();
}

// Retrieves workflow definition along with blueprint
// Version is passed as query parameter.
/*
curl -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow/fx3?version=1"
*/
const getWorkflowBefore = function (tenantId, req, res, proxyCallback) {
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const name = tenantWithUnderscore + req.params.name;
    var newUrl = `/api/metadata/workflow/${name}`;
    const originalQueryString = req._parsedUrl.query;
    const parsedQuery = qs.parse(originalQueryString);
    const version = parsedQuery['version'];
    if (version) {
        newUrl += '?version=' + version;
    }
    console.log('Transformed url from', req.url, 'to', newUrl);
    req.url = newUrl;
    proxyCallback();
}
const getWorkflowAfter = function (tenantId, req, respObj) {
    const ok = sanitizeWorkflowdefAfter(tenantId, respObj);
    if (!ok) {
        console.error('Possible error in code: response contains invalid task or workflowdef name', tenantId);
        throw 'Possible error in code: response contains invalid task or workflowdef name'; // TODO create Exception class
    }
}

// Create or update workflow definition
// Underscore in name is not allowed.
/*
curl -X PUT -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow" \
  -H 'Content-Type: application/json' -d '
[
    {
    "name": "fx3",
    "description": "foo1",
    "ownerEmail": "foo@bar.baz",
    "version": 1,
    "schemaVersion": 2,
    "tasks": [
        {
        "name": "bar",
        "taskReferenceName": "barref",
        "type": "SIMPLE",
        "inputParameters": {}
        }
    ]
    }
]'


curl -X PUT -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow" \
  -H 'Content-Type: application/json' -d '
[
    {
    "name": "fx3",
    "description": "foo1",
    "ownerEmail": "foo@bar.baz",
    "version": 1,
    "schemaVersion": 2,
    "tasks": [
        {
        "name": "bar",
        "taskReferenceName": "barref",
        "type": "SIMPLE",
        "inputParameters": {}
        },
        {
        "name": "GLOBAL_GLOBAL1",
        "taskReferenceName": "globref",
        "type": "SIMPLE",
        "inputParameters": {}
        }
    ]
    }
]'
*/
const putWorkflowBefore = function (tenantId, req, res, proxyCallback) {
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const reqObj = req.body;
    for (var workflowIdx = 0; workflowIdx < reqObj.length; workflowIdx++) {
        const workflowdef = reqObj[workflowIdx];
        sanitizeWorkflowdefBefore(workflowdef, tenantWithUnderscore);
    }
    console.debug('Transformed request to', reqObj);
    proxyCallback({ buffer: utils.createProxyOptionsBuffer(reqObj, req) });
}

// Create a new workflow definition
// Underscore in name is not allowed.
/*
curl -X POST -H "x-auth-organization: FX" "localhost:8081/api/metadata/workflow" \
  -H 'Content-Type: application/json' -d '

    {
    "name": "fx3",
    "description": "foo1",
    "ownerEmail": "foo@bar.baz",
    "version": 1,
    "schemaVersion": 2,
    "tasks": [
        {
        "name": "bar",
        "taskReferenceName": "barref",
        "type": "SIMPLE",
        "inputParameters": {}
        },
        {
        "name": "GLOBAL_GLOBAL1",
        "taskReferenceName": "globref",
        "type": "SIMPLE",
        "inputParameters": {}
        }
    ]
    }
'
*/
const postWorkflowBefore = function (tenantId, req, res, proxyCallback) {
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const reqObj = req.body;
    sanitizeWorkflowdefBefore(reqObj, tenantWithUnderscore);
    console.debug('Transformed request to', reqObj);
    proxyCallback({ buffer: utils.createProxyOptionsBuffer(reqObj, req) });
}

module.exports = {
    register: function (registerFun) {
        registerFun('get', '/api/metadata/workflow', null, getAllWorkflowsAfter);
        registerFun('delete', '/api/metadata/workflow/:name/:version', deleteWorkflowBefore, null);
        registerFun('get', '/api/metadata/workflow/:name', getWorkflowBefore, getWorkflowAfter);
        registerFun('put', '/api/metadata/workflow', putWorkflowBefore, null);
        registerFun('post', '/api/metadata/workflow', postWorkflowBefore, null);
    }
};
