const assert = require('assert').strict;;
var qs = require('qs');
const http = require('http');
const connect = require('connect');
const request = require('request');
const proxyUtils = require(__dirname + '/../../src/proxy-utils.js'); // TODO
const transformerRegistry = require(__dirname + '/../../src/transformer-registry.js'); // TODO

// constants
const mockServerPort = 9090;
const testProxyPort = 9091;

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

describe('Workflow API', function () {
  var mockServer;
  var proxyServer;
  var mockedSearchFun = function(req, res) {
    // happy path, no checks
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(JSON.stringify(mockedSearchResponse(['FB_A', 'FB_B'])));
  }

  this.beforeAll(function () {
    // configure mock server
    const app = connect();
    app.use('/api/workflow/search', function (req, res) {
      mockedSearchFun(req, res);
    });
    // start mock server
    mockServer = http.createServer(app).listen(mockServerPort);

    // start test proxy server
    const transformers = transformerRegistry.init();
    const proxyTarget = 'http://localhost:' + mockServerPort;
    proxyServer = proxyUtils.startProxy(transformers, testProxyPort, proxyTarget);
  });
  this.afterAll(function () {
    mockServer.close();
    proxyServer.close();
  })

  describe('search', function () {
    this.timeout(5000);

    const searchURL = 'http://localhost:' + testProxyPort + '/api/workflow/search';

    it('should fail if tenant id is not sent', function (done) {
      request(searchURL, function (error, response, body) {
        assert.equal(response.statusCode, 500);
        assert.ok(body.indexOf('x-auth-organization header not found') != -1, 'Expected string not found in ' + body);
        done();
      });
    });

    it('should handle tenantId transparently', function (done) {
      mockedSearchFun = function(req, res) {
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


    it('should pass query string with correct prefix', function (done) {
      mockedSearchFun = function(req, res) {
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
  });
});
