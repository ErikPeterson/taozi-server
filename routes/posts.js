'use strict';

const _ = require('lodash');
const Post = require('../models/post');
const Forbidden = require('../lib/errors/forbidden');
const Router = require('koa-router');
const posts = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const authenticateUser = require('../lib/authenticate_user');

const authorizeUserByUserName = require('../lib/authorize_user_by_user_name');

module.exports = (router, logger) => {

	posts.post('posts', '/', 
		authenticateUser, 
		bodyParser, 
		permittedParams, 
		async (ctx, next) => {
			let post_params = ctx.request.params.require('post')
								.permit({body: ['type', 'content', 'src']}).value();

			let post = await Post.create(_.merge({user_id: ctx.current_user_id}, post_params));

			ctx.response.status = 201;
			ctx.response.body = JSON.stringify({post: post.render()});
			await next();
		}
	);

	posts.delete('post', '/:id',
		authenticateUser,
		async (ctx, next) => {
			let post = await Post.find(ctx.params.id);

			if(ctx.current_user_id !== post.get('user_id')) throw new Forbidden('you do not have permission to modify this resource');
			await post.delete();
			ctx.response.status = 204;
		}
	);

    router.use('/posts', posts.routes(), posts.allowedMethods());
};