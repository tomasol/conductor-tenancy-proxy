const { workflowDummyData, taskdefsDummyData } = require('./common/test-data');
const  { initAgent, errorCallback, insertTestData, deleteTestData } = require('./common/shared-functions');
const superagent = require('superagent-use')(require('superagent'));

const taskdefEndpoint = '/metadata/taskdefs';
const metadataWorkflowEndpoint = '/metadata/workflow';

beforeAll((done) => {
  console.debug('beforeAll started');
  initAgent(superagent);

  insertTestData(superagent, taskdefEndpoint, taskdefsDummyData, () => {
    insertTestData(superagent, metadataWorkflowEndpoint, workflowDummyData, () => {
      console.debug('beforeAll done');
      done();
    });
  });
});

afterAll((done) => {
  console.debug('afterAll started');
  deleteTestData(superagent,
      `${metadataWorkflowEndpoint}/${workflowDummyData.name}/${workflowDummyData.version}`,
      () => {
        deleteTestData(superagent, `${taskdefEndpoint}/${taskdefsDummyData[0].name}`, () => {
              console.log('afterAll done');
              done();
            }
        );
      });
});

test('POST/DELETE metadata/taskdefs', done => {
  let taskdefTestData = JSON.parse(JSON.stringify(taskdefsDummyData)); //deep copy
  taskdefTestData[0].name = 'testTaskdef';
  insertTestData(superagent, taskdefEndpoint, taskdefTestData, input => {
    deleteTestData(superagent, `${taskdefEndpoint}/${taskdefTestData[0].name}`, done, expect);
  }, expect);
});

test('PUT metadata/taskdefs', done => {
  const newDescription = 'new taskdef description';
  taskdefsDummyData[0].description = newDescription;
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

test('POST/DELETE metadata/workflow', done => {
  let testWorkflow = JSON.parse(JSON.stringify(workflowDummyData)); //deep copy
  testWorkflow.name = 'testWorkflow';
  insertTestData(superagent, metadataWorkflowEndpoint, testWorkflow, input => {
    deleteTestData(superagent,
        `${metadataWorkflowEndpoint}/${testWorkflow.name}/${testWorkflow.version}`,
        done, expect);
  }, expect);

});

test('PUT metadata/workflow', done => {
  const newDescription = 'new description';
  workflowDummyData.description = newDescription;
  superagent
  .put(metadataWorkflowEndpoint)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify([workflowDummyData]))
  .then(res => {

    //check if stored
    expect(res.status).toBe(204);

    //check if new description updated
    superagent.get(`${metadataWorkflowEndpoint}/${workflowDummyData.name}`)
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
  .get(metadataWorkflowEndpoint)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('integrationTestWorkflow');
    done();
  })
  .catch(errorCallback(done));
});

test('GET metadata/workflow/{name}', done => {
  superagent
  .get(`${metadataWorkflowEndpoint}/${workflowDummyData.name}`)
  .set('Content-Type', 'application/json')
  .then(res => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('integrationTestWorkflow');
    done();
  })
  .catch(errorCallback(done));
});
