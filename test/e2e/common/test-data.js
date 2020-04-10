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

const testWorkflow = {
  "name": "integrationTestWorkflow",
  "version": 0,
  "correlationId": "my_unique_correlation_id",
  "input": {
    "param1": "value1",
    "param2": "value2"
  }
};

module.exports = {workflowDummyData, taskdefsDummyData, testWorkflow};
