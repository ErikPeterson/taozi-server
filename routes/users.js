'use strict';

const User = require('../models/user');
const Auth = require('../models/auth');
const FriendRequest = require('../models/friend_request');
const Unauthorized = require('../lib/errors/unauthorized');
const Forbidden = require('../lib/errors/forbidden');
const BadRequest = require('../lib/errors/bad_request');
const Router = require('koa-router');
const users = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const authenticateUser = require('../lib/authenticate_user');

const authorizeUserByUserName = require('../lib/authorize_user_by_user_name');

module.exports = (router, logger) => {
	users.post('users', '/', 
		bodyParser, 
		permittedParams, 
		async (ctx, next) => {
		    let userParams = ctx.request.params.require('user')
		                        .permit(
		                        	'name', 'email', 'password', 'post_visibility', 
		                        	'old_post_visibility', 'bio', 'display_name', 'avatar_url')
		                        .value();

		    let user = await User.create(userParams);
		    ctx.response.body = JSON.stringify({user: user.render()});
		    ctx.response.status = 201;
		    await next();
		}
	);

	users.get('user', '/me',
		authenticateUser,
		async (ctx, next) => {
			let user = await User.find(ctx.current_user_id);

			ctx.response.body = JSON.stringify({user: user.render()})
			ctx.response.status = 200;
		}
	);

	users.get('user', '/:name', 
		authenticateUser,
		async (ctx, next) => {
			let user = (await User.where({name: ctx.params.name}, {limit: 1}))[0];

			ctx.response.body = JSON.stringify({user: user.render('external')});
			ctx.response.status = 200;
		}
	);


	users.post('user', '/me', 
		authenticateUser, 
		bodyParser, 
		permittedParams, 
		async (ctx, next) => {

			let updateParams = ctx.request.params.require('user')
								.permit(
									'email', 'password', 'name', 'avatar_url', 'bio', 
									'display_name', 'post_visibility', 'old_post_visibility')
								.value();

			let user = await User.find(ctx.current_user_id);
			await user.update(updateParams);

			ctx.response.body = JSON.stringify({user: user.render()});
			ctx.response.status = 200;
			await next();
		}
	);

    router.use('/users', users.routes(), users.allowedMethods());
};