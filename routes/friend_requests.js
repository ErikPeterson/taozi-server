'use strict';

const User = require('../models/user');
const FriendRequest = require('../models/friend_request');
const Forbidden = require('../lib/errors/forbidden');
const BadRequest = require('../lib/errors/bad_request');
const Router = require('koa-router');
const friend_requests = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const authenticateUser = require('../lib/authenticate_user');

const authorizeUserByUserName = require('../lib/authorize_user_by_user_name');

module.exports = (router, logger) => {

	friend_requests.get('friend_requests', '/',
		authenticateUser,
		async (ctx, next) => {
			let requests = await FriendRequest.where({requested_user_id: ctx.current_user_id, accepted_at: null});
			ctx.response.status = 200;
			ctx.response.body = JSON.stringify({friend_requests: requests.map((r) => r.render())});
		}
	);
	
	friend_requests.post('friend_requests', '/',
		authenticateUser, 
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

    router.use('/friend_requests', friend_requests.routes(), friend_requests.allowedMethods());
};