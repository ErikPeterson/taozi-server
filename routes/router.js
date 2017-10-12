'use strict';

const Router = require('koa-router');
const router = new Router();

const apps = ['users.js'];

apps.forEach((app) => require(`./${app}`)(router) );

module.exports = router;