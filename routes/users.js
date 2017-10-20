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
		                        .permit('name', 'email', 'password')
		                        .value();

		    let user = await User.create(userParams);
		    ctx.response.body = JSON.stringify({user: user.render()});
		    ctx.response.status = 201;
		    await next();
		}
	);


	users.post('user', '/:user_name', 
		authenticateUser, 
		authorizeUserByUserName, 
		bodyParser, 
		permittedParams, 
		async (ctx, next) => {

			let updateParams = ctx.request.params.require('user')
								.permit('email', 'password', 'name', 'avatar_url', 'bio', 'display_name').value();

			await ctx.current_user.update(updateParams);

			ctx.response.body = JSON.stringify({user: ctx.current_user.render()});
			ctx.response.satus = 200;
			await next();
		}
	);

	users.get('user_friend_requests', '/:user_name/friend_requests')

	users.post('user_friend_requests', '/:user_name/friend_requests',
		authenticateUser, 
		authorizeUserByUserName, 
		bodyParser, 
		permittedParams, 
		async (ctx, next) => {
			let createParams = ctx.request.params.require('friend_request')
								.permit('requested_name').value();

			let requested_users = await User.where({name: createParams.requested_name }, 1);
			let requested_user = requested_users[0];

			if(!requested_user) throw new BadRequest('the requested user does not exist');

			let friend_request = await FriendRequest.create({requested_user_id: requested_user.get('_id').toString(), requesting_user_id: ctx.current_user_id});
			ctx.response.status = 201;
			ctx.response.body = JSON.stringify({friend_request: friend_request.render()});
			await next();
		}
	);

    router.use('/users', users.routes(), users.allowedMethods());
};