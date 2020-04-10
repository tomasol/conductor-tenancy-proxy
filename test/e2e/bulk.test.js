const { workflowDummyData, taskdefsDummyData, testWorkflow } = require('./common/test-data');
const  { initProxy, errorCallback, insertTestData, deleteTestData } =  require('./common/shared-functions');
const superagent = require('superagent-use')(require('superagent'));

const taskdefEndpoint = '/metadata/taskdefs';
const metadataWorkflowEndpoint = '/metadata/workflow';
const workflowEndpoint = '/workflow';
const workflowBulkEndpoint = '/workflow/bulk';

let proxyServer;

beforeAll(() => {
  proxyServer = initProxy(superagent);
  insertTestData(superagent, taskdefEndpoint, taskdefsDummyData, console.log);
  insertTestData(superagent, metadataWorkflowEndpoint, workflowDummyData, console.log);
});

afterAll(() => {
  proxyServer.close();
  deleteTestData(superagent,
      `${metadataWorkflowEndpoint}/${workflowDummyData.name}/${workflowDummyData.version}`,
      console.log);
  deleteTestData(superagent, `${taskdefEndpoint}/${taskdefsDummyData[0].name}`, console.log);
});

let workflowId;

test('POST workflow (start workflow)', done => {
  superagent
  .post(workflowEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify(testWorkflow))
  .then(res => {
    expect(res.status).toBe(200);
    workflowId = res.text;
    done();
  })
  .catch(errorCallback(done));
});

test('PUT workflow/bulk/pause ', done => {
  superagent
  .put(`${workflowBulkEndpoint}/pause`)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowId]))
  .then(res => {
    expect(res.status).toBe(200);
    done();
  })
  .catch(errorCallback(done));
});

test('PUT workflow/bulk/resume ', done => {
  superagent
  .put(`${workflowBulkEndpoint}/resume`)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowId]))
  .then(res => {
    expect(res.status).toBe(200);
    done();
  })
  .catch(errorCallback(done));
});

test('POST workflow/bulk/retry', done => {
  superagent
  .post(`${workflowBulkEndpoint}/retry`)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowId]))
  .then(res => {
    expect(res.status).toBe(200);
    done();
  })
  .catch(errorCallback(done));
});

test('POST workflow/bulk/restart', done => {
  superagent
  .post(`${workflowBulkEndpoint}/restart`)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowId]))
  .then(res => {
    expect(res.status).toBe(200);
    done();
  })
  .catch(errorCallback(done));
});

test('POST workflow/bulk/terminate ', done => {
  superagent
  .delete(`${workflowBulkEndpoint}/terminate`)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowId]))
  .then(res => {
    expect(res.status).toBe(200);
    done();
  })
  .catch(errorCallback(done));
});
