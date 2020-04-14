const Router = require("express");
const proxy = require('../../../src/proxy.js');
const transformerRegistry = require('../../../src/transformer-registry.js');
const bodyParser = require('body-parser');
const superagentPrefix = require('superagent-prefix');

const initProxy = function (superagent) {

  //adding tenant ID to all requests
  superagent.use((req) => {
    req.header['x-auth-organization'] = 'integrationTestTenant';
    return req;
  });
  const testProxyPort = process.env.TEST_PROXY_PORT || 8082;
  const testProxyHost = process.env.TEST_PROXY_HOST || 'localhost';
  const conductorServerPort = process.env.TEST_CONDUCTOR_PORT || 8080;
  const conductorServerHost = process.env.TEST_CONDUCTOR_HOST || 'localhost';

  //adding default base url to all requests
  superagent.use(superagentPrefix(`http://${testProxyHost}:${testProxyPort}/api`));

  const transformers = transformerRegistry.init();
  const proxyTarget = `http://${conductorServerHost}:${conductorServerPort}`;

  const proxyRouter = proxy.configure(transformers, proxyTarget);
  let app = Router();
  app.use(bodyParser.urlencoded({extended: false}));
  app.use('/', bodyParser.json(), proxyRouter);
  return app.listen(testProxyPort);
}

const errorCallback = done => { return err => done(`${err.status} error message: ${err.message}`); };

const insertTestData = function (superagent, endpointUrl, dataToInsert, done, expect) {
  superagent
  .post(endpointUrl)
  .set('Content-Type', 'application/json')
  .send(JSON.stringify(dataToInsert))
  .then(res => {
    if(expect){
      expect(res.status).toBe(204);
    }
    done();
  })
  .catch(errorCallback(done));
}

const deleteTestData = function(superagent, endpointUrl, done, expect) {
  superagent
  .delete(endpointUrl)
  .set('Content-Type', 'application/json')
  .then(res => {
    if(expect){
      expect(res.status).toBe(204);
    }
    done();
  })
  .catch(errorCallback(done));
}


module.exports = { initProxy, errorCallback, insertTestData, deleteTestData };
