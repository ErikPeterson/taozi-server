'use strict';

const expect = require('expect.js');
const Post = require('../../models/post');
const User = require('../../models/user');
const Auth = require('../../models/auth');
const DB = require('../support/db_cleaner');
const API = require('../support/api');

describe('/posts', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	let user;
	let auth;
	let headers = {};
	let params;
	
	beforeEach(async () => {
		user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
		auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
		headers.Authorization = `Bearer ${auth.get('token')}`;
	});

	describe('AUTHENTICATED POST /posts {post: {body}}', () => {
		describe('with a logged in user', () => {
			it('creates a new post', async () => {
				params = {
					post: {
						body: [{type: 'text', content: 'what up'}, {type: 'img', src: 'https://blahbalh.com/whatever.jpg'}]
					}
				};

				let resp = await API.post('/posts', params, headers);
				
				expect(resp.statusCode).to.be(201);
				expect(resp.body.post.body).to.eql(params.post.body);
				expect(resp.body.post.user_id).to.be(user.get('_id').toString());
				expect(resp.body.post.created_at).to.be.ok();
			})
		});
	});

	describe('AUTHENTICATED DELETE /posts/:id', () => {

		describe('with a logged in user', () => {
			it('deletes the indicated post', async () => {
				let post = await Post.create({user_id: user.get('_id').toString(), body: [{type: 'text', content: ''}]});
				let resp = await API.delete(`/posts/${post.get('_id')}`, headers);
				expect(resp.statusCode).to.be(204);
				expect(resp.body).to.not.be.ok();
			});

			describe('if logged in user does not own indicated post', async () => {
				it('responds with a 403', async () => {
					let post = await Post.create({user_id: '1234', body: [{type: 'text', content: ''}]});
					let resp = await API.delete(`/posts/${post.get('_id')}`, headers);
					expect(resp.statusCode).to.be(403);
				});
			});
		});
	});
});