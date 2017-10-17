'use strict';

const User = require('../models/user')

const Router = require('koa-router');
const users = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const logger = require('../lib/logger')().logger;

users.post('user', '/', bodyParser, permittedParams, async (ctx, next) => {
    let userParams = ctx.request.params.require('user')
                        .permit('name', 'email', 'password')
                        .value();

    let user = await User.create(userParams);
    ctx.response.body = JSON.stringify({user: user.render()});
    ctx.response.status = 201;
    await next();
});

module.exports = (router) => {
    router.use('/users', users.routes(), users.allowedMethods());
};