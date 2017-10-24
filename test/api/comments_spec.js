'use strict';

const expect = require('expect.js');
const Post = require('../../models/post');
const User = require('../../models/user');
const Auth = require('../../models/auth');
const DB = require('../support/db_cleaner');
const API = require('../support/api');
const FriendRequest = require('../../models/friend_request');

describe('/posts', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('AUTHENTICATED POST /posts/:id/comments', () => {
		let post;
		let creator;
		let commenter;
		let path;
		let params;
		let headers;

		beforeEach( async () => {
			creator = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
			commenter = await User.create({name: 'b', email: 'b@c.com', password: '123456'}); 	
			let auth = await Auth.createByCredentials({email: 'b@c.com', password: '123456'});
			headers = { Authorization: `Bearer ${auth.get('token')}`};
			post = await Post.create({user_id: creator.get('_id').toString(), body: [{type: 'text', content: ''}]})
			params = { comment: { text: "Wow what a great post!" }};
			path = `/posts/${post.get('_id')}/comments`;
		});

		describe('with an authenticated user who is a friend of the owner of the post', () => {

			it('creates a comment', async () => {
				await FriendRequest.create({requested_user_id: creator.get('_id').toString(), requesting_user_id: commenter.get('_id').toString(), accepted: true});

				let resp = await API.post(path, params, headers);
				expect(resp.statusCode).to.be(201);
				console.log(resp.body);
				expect(resp.body.comment.text).to.be("Wow what a great post!");
				expect(resp.body.comment.post_id).to.be(post.get('_id').toString());
				expect(resp.body.comment.user_id).to.be(commenter.get('_id').toString());
			});

		});

		describe('with an authenticated user who is not a friend of the owner of the post', () => {

			it('responds with a 403', async () => {
				let resp = await API.post(path, params, headers);
				expect(resp.statusCode).to.be(403);
			});

		});
	});
});