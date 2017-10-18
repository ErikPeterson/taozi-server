'use strict';

const User = require('../models/user');
const Auth = require('../models/auth');
const Unauthorized = require('../lib/errors/unauthorized');
const Router = require('koa-router');
const users = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');

module.exports = (router, logger) => {
	users.post('user', '/', bodyParser, permittedParams, async (ctx, next) => {
	    let userParams = ctx.request.params.require('user')
	                        .permit('name', 'email', 'password')
	                        .value();

	    let user = await User.create(userParams);
	    ctx.response.body = JSON.stringify({user: user.render()});
	    ctx.response.status = 201;
	    await next();
	});

	users.post('auth', '/auth', bodyParser, permittedParams, async (ctx, next) => {
		let authParams = ctx.request.params.require('auth')
							.permit('email', 'password')
							.value();
		try{
			let auth = await Auth.createByCredentials(authParams);
			ctx.response.body = JSON.stringify({auth: auth.render()});
			ctx.response.status = 201;
		} catch(e) {
			if(e.constructor.name === 'RecordInvalid') throw new Unauthorized('no user with those credentials could be found');
			throw e;
		}
		await next();	
	});

    router.use('/users', users.routes(), users.allowedMethods());
};