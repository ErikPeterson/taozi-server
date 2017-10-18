'use strict';

const Koa = require('koa');
const app = new Koa();

const {logger, middleware} = require('./lib/logger')();
const catchErrors = require('./lib/catch_errors')(logger);

app.use(middleware);

app.use(catchErrors);

const router = require('./routes/router.js')(logger);
app.use(router.routes());

app.listen(process.env.port || 3000);

module.exports = app;