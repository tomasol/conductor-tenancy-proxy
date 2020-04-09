'use strict';

const express = require("express");
const bodyParser = require('body-parser');
const proxy = require('./proxy.js');
const transformerRegistry = require('./transformer-registry.js');

const port = process.env.NODE_PORT || 8081;
const host = process.env.NODE_HOST || "0.0.0.0";
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:8080';

const transformers = transformerRegistry.init(proxyTarget);

const proxyRouter = proxy.configure(transformers, proxyTarget);
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use('/', bodyParser.json(), proxyRouter);

app.listen(port, host, () => console.log("Server is listening at http://%s:%s", host, port));
