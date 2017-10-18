'use strict';

const Router = require('koa-router');
const router = new Router();

const apps = ['users.js'];

module.exports = (logger) => {

	apps.forEach((app) => require(`./${app}`)(router, logger));
	
	return router;
};