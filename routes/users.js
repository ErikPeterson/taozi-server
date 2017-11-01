'use strict';

const User = require('../models/user');
const Auth = require('../models/auth');
const Unauthorized = require('../lib/errors/unauthorized');
const Forbidden = require('../lib/errors/forbidden');
const BadRequest = require('../lib/errors/bad_request');
const RecordNotFound = require('../models/errors/record_not_found');
const IncreaseYourChill = require('../lib/errors/increase_your_chill');
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
		    ctx.response.body = {user: user.render()};
		    ctx.response.status = 201;
		}
	);

	users.get('user', '/me',
		authenticateUser,
		async (ctx, next) => {
			let user = await User.find(ctx.current_user_id);
			ctx.response.body = {user: user.render()};
			ctx.response.status = 200;
		}
	);


	users.get('user', '/:name', 
		authenticateUser,
		async (ctx, next) => {
			let user = (await User.where({name: ctx.params.name}, {limit: 1}))[0];

			ctx.response.body = {user: user.render('external')};
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

			ctx.response.body = {user: user.render()};
			ctx.response.status = 200;
		}
	);

	users.post('user_accept_friend_request', '/me/friend_requests/:user_id/accept',
		authenticateUser,
		async (ctx, next) => {
			let user = await User.find(ctx.current_user_id);
			await user.befriend(ctx.params.user_id);

			ctx.response.body = {};
			ctx.response.status = 201;
		}
	);

	users.post('user_ignore_friend_request', '/me/friend_requests/:user_id/ignore',
		authenticateUser,
		async (ctx, next) => {
			let user = await User.find(ctx.current_user_id);
			await user.ignore(ctx.params.user_id);

			ctx.response.body = {};
			ctx.response.status = 201;
		}
	);

	users.post('user_friend_requests', '/:name/friend_requests',
		authenticateUser,
		async (ctx, next) => {
			let user = (await User.where({name: ctx.params.name}, {limit: 1}))[0];
			if((user.get('friends') || []).includes(ctx.current_user_id)) throw new IncreaseYourChill('you are already friends');
			if(user.friendRequested(ctx.current_user_id)) throw new IncreaseYourChill('you cannot create a new friend request with this user');

			await user.requestFriendship(ctx.current_user_id);

			ctx.response.body = {};
			ctx.response.status = 201;
		}
	);

	users.post('user_block', '/:name/block', 
		authenticateUser,
		async (ctx, next) => {
			let user = (await User.where({name: ctx.params.name}, {limit: 1}))[0];
			if(!user) throw new RecordNotFound('User', {name: ctx.params.name});
			let blocker = await User.find(ctx.current_user_id);

			await blocker.blockUser(user.get('_id'));

			ctx.response.body = {}
			ctx.response.status = 201;			
		}
	);

	users.post('user_unblock', '/:name/unblock', 
		authenticateUser,
		async (ctx, next) => {
			let user = (await User.where({name: ctx.params.name}, {limit: 1}))[0];
			if(!user) throw new RecordNotFound('User', {name: ctx.params.name});
			let unblocker = await User.find(ctx.current_user_id);

			await unblocker.unblockUser(user.get('_id'));

			ctx.response.body = {}
			ctx.response.status = 200;			
		}
	);
    router.use('/users', users.routes(), users.allowedMethods());
};