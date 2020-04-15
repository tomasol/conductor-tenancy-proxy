const Router = require("express");
const assert = require('assert').strict;;
const qs = require('qs');
const request = require('request');
const proxy = require('../../src/proxy.js');
const transformerRegistry = require('../../src/transformer-registry.js');

const mockServerPort = process.env.TEST_MOCK_PORT || 9090;
const mockServerHost = process.env.TEST_MOCK_HOST || 'localhost';
const testProxyPort = process.env.TEST_PROXY_PORT || 9091;
const testProxyHost = process.env.TEST_PROXY_HOST || 'localhost';
const proxyPath = 'conductor-proxy';

const mockedSearchResponse = function (nameArray) {
  const arr = [];
  for (const nameIdx in nameArray) {
    const name = nameArray[nameIdx];
    arr.push(
      {
        "endTime": "2020-03-31T11:05:44.945Z",
        "executionTime": 659,
        "failedReferenceTaskNames": "graphOverHTTP",
        "input": "{identType=animation, contentId=my_unique_content_id}",
        "inputSize": 53,
        "output": "{response=com.sun.jersey.api.client.ClientHandlerException: java.net.UnknownHostException: integration_graph_1}",
        "outputSize": 111,
        "priority": 0,
        "reasonForIncompletion": "Failed to invoke http task due to: com.sun.jersey.api.client.ClientHandlerException: java.net.UnknownHostException: integration_graph_1",
        "startTime": "2020-03-31T11:05:44.286Z",
        "status": "FAILED",
        "updateTime": "2020-03-31T11:05:44.945Z",
        "version": 2,
        "workflowId": "f5ae19b6-3513-401f-8183-5572d4e4e554",
        "workflowType": name
      }
    );
  }
  return {
    "results": arr,
    "totalHits": nameArray.length
  }
}


let mockServer;
let proxyServer;
let mockedSearchFun = function (req, res) {
  // happy path, no checks
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  res.end(JSON.stringify(mockedSearchResponse(['FB_A', 'FB_B'])));
}

beforeAll(() => {
  // configure mock server
  const mockApp = Router();
  mockApp.use('/api/workflow/search', function (req, res) {
    mockedSearchFun(req, res);
  });
  // start mock server
  mockServer = mockApp.listen(mockServerPort, mockServerHost);

  // start test proxy server
  const proxyTarget = `http://${mockServerHost}:${mockServerPort}`;
  const transformers = transformerRegistry.init(proxyTarget);

  const proxyRouter = proxy.configure(transformers, proxyTarget);
  const app = Router();

  app.use('/' + proxyPath, proxyRouter);
  proxyServer = app.listen(testProxyPort, testProxyHost);
});

afterAll(() => {
  mockServer.close();
  proxyServer.close();
});


const searchURL = `http://${testProxyHost}:${testProxyPort}/${proxyPath}/api/workflow/search`;

test('should fail if tenant id is not sent', function (done) {
  request(searchURL, function (error, response, body) {
    assert.equal(response.statusCode, 400);
    assert.ok(body.indexOf('x-auth-organization header not found') != -1,
      'Expected string not found in ' + body);
    done();
  });
});

test('should handle tenantId transparently', function (done) {
  mockedSearchFun = function (req, res) {
    var originalQueryString = req._parsedUrl.query;
    var parsedQuery = qs.parse(originalQueryString);
    var q = parsedQuery['query'];
    assert.equal(q, 'workflowType STARTS_WITH \'FB_\'');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(JSON.stringify(mockedSearchResponse(['FB_A', 'FB_B'])));
  }
  const requestOptions = {
    url: searchURL,
    headers: {
      'x-auth-organization': 'FB'
    }
  };
  request(requestOptions, function (error, response, body) {
    assert.equal(response.statusCode, 200);
    // check that response json does not contain FB_ prefix in workflow names
    const respObj = JSON.parse(body);
    assert.equal(respObj.totalHits, 2);
    assert.equal(respObj.results[0].workflowType, 'A');
    assert.equal(respObj.results[1].workflowType, 'B');
    done();
  });
});

test('should pass query string with correct prefix', function (done) {
  mockedSearchFun = function (req, res) {
    var originalQueryString = req._parsedUrl.query;
    var parsedQuery = qs.parse(originalQueryString);
    var q = parsedQuery['query'];
    assert.equal(q, 'workflowType STARTS_WITH \'FB_\' AND (somequery)');
    assert.equal(parsedQuery['size'], '2');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(JSON.stringify(mockedSearchResponse(['FB_A', 'FB_B'])));
  }
  const requestOptions = {
    url: searchURL + '?query=somequery&size=2',
    headers: {
      'x-auth-organization': 'FB'
    }
  };
  request(requestOptions, function (error, response, body) {
    assert.equal(response.statusCode, 200);
    // check that response json does not contain FB_ prefix in workflow names
    const respObj = JSON.parse(body);
    assert.equal(respObj.totalHits, 2);
    assert.equal(respObj.results[0].workflowType, 'A');
    assert.equal(respObj.results[1].workflowType, 'B');
    done();
  });
});
