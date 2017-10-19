'use strict';

const User = require('../models/user');
const Auth = require('../models/auth');
const Unauthorized = require('../lib/errors/unauthorized');
const Forbidden = require('../lib/errors/forbidden');
const Router = require('koa-router');
const users = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const authenticateUser = require('../lib/authenticate_user');

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


	users.post('user', '/:name', authenticateUser, bodyParser, permittedParams, async (ctx, next) => {
		let name = decodeURIComponent(ctx.params.name);
		let users = await User.where({name: name}, 1);
		let user = users[0];

		if(!user) throw new NotFound('no user with that name could be found');
		if(user.get('_id').toString() !== ctx.current_user_id) throw new Forbidden('the authenticated user does not have permission to modify this resource');

		let updateParams = ctx.request.params.require('user')
							.permit('email', 'password', 'name', 'avatar_url').value();

		await user.update(updateParams);

		ctx.response.body = JSON.stringify({user: user.render()});
		ctx.response.satus = 200;
		await next();
	});

    router.use('/users', users.routes(), users.allowedMethods());
};