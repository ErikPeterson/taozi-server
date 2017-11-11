'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';
const statuses = require('statuses');
statuses[420] = 'Increase your chill';

const Koa = require('koa');
const cors = require('koa2-cors');
const app = new Koa();

const {logger, middleware} = require('./lib/logger')();
const catchErrors = require('./lib/catch_errors')(logger);

app.use(middleware);

app.use(catchErrors);

if(NODE_ENV !== 'production') app.use(cors({
	maxAge: 7 * 24 * 60 * 60, 
	origin: '*',
	authentication: true,
	allowMethods: ['GET', 'POST', 'OPTIONS', 'DELETE'], 
	allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

const router = require('./routes/router.js')(logger);
app.use(router.routes());

module.exports = app;