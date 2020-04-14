const { workflowDummyData, taskdefsDummyData, testWorkflow } = require('./common/test-data');
const  { initProxy, errorCallback, insertTestData, deleteTestData } =  require('./common/shared-functions');
const superagent = require('superagent-use')(require('superagent'));

const taskdefEndpoint = '/metadata/taskdefs';
const metadataWorkflowEndpoint = '/metadata/workflow';
const workflowEndpoint = '/workflow';
const workflowBulkEndpoint = '/workflow/bulk';
const workflowSearchEndpoint = '/workflow/search?query=workflowId+IN+';
const maxWorkflowSearchRetries = 50;

let proxyServer;

let workflowId;

// Adding a workflow to conductor does not immediately make it available via ElasticSearch.
// Wait until the workflow can be retrieved.
const waitUntilWorkflowIsFound = function(done, retriesLeft = maxWorkflowSearchRetries) {
  console.debug('waitUntilWorkflowIsFound', retriesLeft);
  if (retriesLeft < 1) {
    console.error('No retries left');
    errorCallback(done);
    throw 'No retries left';
  }
  superagent
  .get(workflowSearchEndpoint + '(' + workflowId + ')')
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    console.debug('Search result', res.body);
    expect(res.body.totalHits).toBe(1);
    done();
  })
  .catch(function() {
    setTimeout(function() {waitUntilWorkflowIsFound(done, retriesLeft - 1);}, 100);
  });
}

beforeAll((done) => {
  console.debug('beforeAll started');
  proxyServer = initProxy(superagent, () => {
    insertTestData(superagent, taskdefEndpoint, taskdefsDummyData, () => {
      insertTestData(superagent, metadataWorkflowEndpoint, workflowDummyData, () => {

        superagent
        .post(workflowEndpoint)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(testWorkflow))
        .then(res => {
          expect(res.status).toBe(200);
          workflowId = res.text;
          waitUntilWorkflowIsFound(()=> {
            console.debug('beforeAll done');
            done();
          });
        })
        .catch(errorCallback(done));

      });
    });
  });

});

afterAll((done) => {
  console.debug('afterAll started');
  proxyServer.close(()=> {
  deleteTestData(superagent,
    `${metadataWorkflowEndpoint}/${workflowDummyData.name}/${workflowDummyData.version}`,
    () => {
      deleteTestData(superagent, `${taskdefEndpoint}/${taskdefsDummyData[0].name}`, () => {
        console.log('afterAll done');
        done();
      });
    });
  });

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

test('DELETE workflow/bulk/terminate ', done => {
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
