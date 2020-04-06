// Currently just filters result without passing prefix to conductor.
// TODO: implement querying by prefix in conductor
const utils = require('../utils.js');

// Gets all task definition
/*
curl  -H "x-auth-organization: FX" "localhost:8081/api/metadata/taskdefs"
*/
const getAllTaskdefsAfter = function(tenantId, req, respObj) {
    // iterate over taskdefs, keep only those belonging to tenantId or global
    // remove tenantId prefix, keep GLOBAL_
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const globalWithUnderscore = utils.withUnderscore(utils.GLOBAL_PREFIX);
    for(var idx = respObj.length -1; idx >= 0 ; idx--) {
        const taskdef = respObj[idx];
        if (taskdef.name.indexOf(tenantWithUnderscore) == 0) {
           taskdef.name = taskdef.name.substr(tenantWithUnderscore.length);
        } else if (taskdef.name.indexOf(globalWithUnderscore) == 0) {
            // noop
        } else {
            // remove element
            respObj.splice(idx, 1);
        }
    }
}

// Create new task definition(s)
// Underscore in name is not allowed.
/*
curl -X POST -H "x-auth-organization: FX" "localhost:8081/api/metadata/taskdefs" -H 'Content-Type: application/json' -d '
[
    {
      "name": "frinx",
      "retryCount": 3,
      "retryLogic": "FIXED",
      "retryDelaySeconds": 10,
      "timeoutSeconds": 300,
      "timeoutPolicy": "TIME_OUT_WF",
      "responseTimeoutSeconds": 180,
      "ownerEmail": "foo@bar.baz"
    }
]
'
*/
// TODO: can this be disabled?
const postTaskdefsBefore = function(tenantId, req) {
    // iterate over taskdefs, prefix with tenantId
    const tenantWithUnderscore = utils.withUnderscore(tenantId);
    const reqObj = req.body;
    for(var idx = 0; idx < reqObj.length; idx++) {
        const taskdef = reqObj[idx];
        if (taskdef.name.indexOf('_')>-1) {
            console.error('Name must not contain underscore', tenantId, reqObj);
            throw 'Name must not contain underscore'; // TODO create Exception class
        }
        // prepend tenantId
        taskdef.name = tenantWithUnderscore + taskdef.name;
    }
    return {buffer: utils.createProxyOptionsBuffer(reqObj)};
}

/*
curl  -H "x-auth-organization: FX" "localhost:8081/api/metadata/taskdefs/frinx"
*/
// Gets the task definition
const getTaskdefByNameBefore = function(tenantId, req) {
    req.params.name = utils.withUnderscore(tenantId) + req.params.name;
    // modify url
    req.url = '/api/metadata/taskdefs/' + req.params.name;
};
const getTaskdefByNameAfter = function(tenantId, req, respObj, res) {
    if (res.status == 200) {
        const tenantWithUnderscore = utils.withUnderscore(tenantId);
        // remove prefix
        if (respObj.name && respObj.name.indexOf(tenantWithUnderscore) == 0) {
            respObj.name = respObj.name.substr(tenantWithUnderscore.length);
        } else {
            console.error('Prefix not found', tenantId, respObj);
            res.status(400);
            res.send('Prefix not found'); // TODO: this exits the process
        }
    }
}

// TODO: can this be disabled?
// Remove a task definition
const deleteTaskdefByNameBefore = function(tenantId, req) {
    req.params.name = utils.withUnderscore(tenantId) + req.params.name;
    // modify url
    req.url = '/api/metadata/taskdefs/' + req.params.name;
}

module.exports = {
    register: function(registerFun) {
        registerFun('get',    '/api/metadata/taskdefs', null, getAllTaskdefsAfter);
        registerFun('post',   '/api/metadata/taskdefs', postTaskdefsBefore, null);
        registerFun('get',    '/api/metadata/taskdefs/:name', getTaskdefByNameBefore, getTaskdefByNameAfter);
        registerFun('delete', '/api/metadata/taskdefs/:name', deleteTaskdefByNameBefore, null);
    }
};
