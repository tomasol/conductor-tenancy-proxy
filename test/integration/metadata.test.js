const Router = require("express");
const bodyParser = require('body-parser');
const superagent = require('superagent-use')(require('superagent'));
const superagentPrefix = require('superagent-prefix');
const proxy = require('../../src/proxy.js');
const transformerRegistry = require('../../src/transformer-registry.js');

const testProxyPort = process.env.TEST_PROXY_PORT || 8082;
const testProxyHost = process.env.TEST_PROXY_HOST || 'localhost';
const conductorServerPort = process.env.TEST_CONDUCTOR_PORT || 8080;
const conductorServerHost = process.env.TEST_CONDUCTOR_HOST || 'localhost';

//tenant ID used in requests
const tenantId = 'integrationTestTenant';

//adding default base url to all requests
superagent.use(superagentPrefix(`http://${testProxyHost}:${testProxyPort}/api`));

//adding tenant ID to all requests
superagent.use((req) => {
  req.header['x-auth-organization'] = tenantId;
  return req;
});

const taskdefEndpoint = '/metadata/taskdefs';
const workflowEndpoint = '/metadata/workflow';

const errorCallback = done => { return err => done(`${err.status} error message: ${err.message}`); };

const taskdefsDummyData = [
  {
    'ownerApp': 'integrationTestDummy',
    'createTime': 1,
    'updateTime': 1,
    'createdBy': 'integrationTestDummy',
    'updatedBy': 'integrationTestDummy',
    'name': 'integrationTestDummy',
    'description': 'integrationTestDummy',
    'retryCount': 1,
    'timeoutSeconds': 1,
    'inputKeys': [
      'integrationTestDummy'
    ],
    'outputKeys': [
      'integrationTestDummy'
    ],
    'timeoutPolicy': 'RETRY',
    'retryLogic': 'FIXED',
    'retryDelaySeconds': 1,
    'responseTimeoutSeconds': 1,
    'concurrentExecLimit': 0,
    'inputTemplate': {},
    'rateLimitPerFrequency': 0,
    'rateLimitFrequencyInSeconds': 0,
    'isolationGroupId': 'integrationTestDummy',
    'executionNameSpace': 'integrationTestDummy',
    'ownerEmail': 'integrationTestDummy@gmail.com',
    'pollTimeoutSeconds': 0
  }
];

const workflowDummyData = {
  'ownerApp': 'integrationTestWorkflow',
  'createTime': 1,
  'updateTime': 1,
  'createdBy': 'integrationTestWorkflow',
  'updatedBy': 'integrationTestWorkflow',
  'name': 'integrationTestWorkflow',
  'description': 'integrationTestWorkflow',
  'version': 0,
  'tasks': [
    {
      'name': 'integrationTestDummy',
      'taskReferenceName': 'integrationTestDummy',
      'type': 'SIMPLE',
      'inputParameters': {
        'fileLocation': '${workflow.input.fileLocation}'
      }
    }
  ],
  'inputParameters': [],
  'outputParameters': {},
  'schemaVersion': 2,
  'restartable': false,
  'workflowStatusListenerEnabled': false,
  'ownerEmail': 'integrationTestWorkflow@gmail.com',
  'timeoutPolicy': 'TIME_OUT_WF',
  'timeoutSeconds': 1
};

let proxyServer;

beforeAll(() => {
  const transformers = transformerRegistry.init();
  const proxyTarget = `http://${conductorServerHost}:${conductorServerPort}`;

  const proxyRouter = proxy.configure(transformers, proxyTarget);
  const app = Router();
  app.use(bodyParser.urlencoded({extended: false}));
  app.use('/', bodyParser.json(), proxyRouter);
  proxyServer = app.listen(testProxyPort);
});

afterAll(() => {
  proxyServer.close();
});

test('POST metadata/taskdefs', done => {
  superagent
  .post(taskdefEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify(taskdefsDummyData))
  .then(res => {
    expect(res.status).toBe(204);
    done();
  })
  .catch(errorCallback(done));
});

test('PUT metadata/taskdefs', done => {
  const newDescription = 'new taskdef description';
  taskdefsDummyData.description = newDescription;
  superagent
  .put(taskdefEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify(taskdefsDummyData[0]))
  .then(res => {

    //check if stored
    expect(res.status).toBe(204);
    //check if new description updated
    superagent.get(`${taskdefEndpoint}/${taskdefsDummyData[0].name}`)
    .set('Content-Type', 'application/json')
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe(newDescription);
      done();
    })
    .catch(errorCallback(done));
  })
  .catch(errorCallback(done));
});


test('GET metadata/taskdefs', done => {
  superagent
  .get(taskdefEndpoint)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('integrationTestDummy');
    done();
  })
  .catch(errorCallback(done));
});

test('GET metadata/taskdefs/{tasktype}', done => {
  superagent
  .get(`${taskdefEndpoint}/${taskdefsDummyData[0].name}`)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body.ownerApp).toBe('integrationTestDummy');
    done();
  })
  .catch(errorCallback(done));
});

test('POST metadata/workflow', done => {
  superagent
  .post(workflowEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify(workflowDummyData))
  .then(res => {
    expect(res.status).toBe(204);
    done();
  })
  .catch(errorCallback(done));
});

test('PUT metadata/workflow', done => {
  const newDescription = 'new description';
  workflowDummyData.description = newDescription;
  superagent
  .put(workflowEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowDummyData]))
  .then(res => {

    //check if stored
    expect(res.status).toBe(204);

    //check if new description updated
    superagent.get(`${workflowEndpoint}/${workflowDummyData.name}`)
    .set('Content-Type', 'application/json')
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe(newDescription);
      done();
    })
    .catch(errorCallback(done));
  })
  .catch(errorCallback(done));
});


test('GET metadata/workflow', done => {
  superagent
  .get(workflowEndpoint)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('integrationTestWorkflow');
    done();
  })
  .catch(errorCallback(done));
});

test('GET metadata/workflow/{name}', done => {
  superagent
  .get(`${workflowEndpoint}/${workflowDummyData.name}`)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('integrationTestWorkflow');
    done();
  })
  .catch(errorCallback(done));
});


test('DELETE metadata/workflow/{name}/{version}', done => {
  superagent
  .delete(`${workflowEndpoint}/${workflowDummyData.name}/${workflowDummyData.version}`)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(204);
    done();
  })
  .catch(errorCallback(done));
});

test('DELETE metadata/taskdefs/{tasktype}', done => {
  superagent
  .delete(`${taskdefEndpoint}/${taskdefsDummyData[0].name}`)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(204);
    done();
  })
  .catch(errorCallback(done));
});
