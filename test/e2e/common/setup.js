const  { initAgent, errorCallback, insertTestData, deleteTestData, initProxy } =  require('./shared-functions');

module.exports = async () => {
  global.globalProxy = initProxy();
};