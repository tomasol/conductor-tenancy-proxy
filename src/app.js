'use strict';

const proxyUtils = require('./proxy-utils.js');
const transformerRegistry = require('./transformer-registry.js');

const transformers = transformerRegistry.init();

// TODO: make configurable
const proxyPort = '8081';
const proxyTarget = 'http://localhost:8080';

proxyUtils.startProxy(transformers, proxyPort, proxyTarget);
