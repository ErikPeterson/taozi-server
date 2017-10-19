'use strict';

const User = require('../models/user');
const Auth = require('../models/auth');
const Unauthorized = require('../lib/errors/unauthorized');
const Router = require('koa-router');
const auth = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');

module.exports = (router, logger) => {
	auth.post('auth', '/', bodyParser, permittedParams, async (ctx, next) => {
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


    router.use('/auth', auth.routes(), auth.allowedMethods());
};