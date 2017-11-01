'use strict';

const _ = require('lodash');
const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');
const sinon = require('sinon');
const faker = require('faker');

const Auth = require('../../models/auth');

describe('/users', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	let props = {
		email: 'a@b.com', 
		name: 'a', 
		bio: 'What up it is a bio', 
		display_name: 'Wow!', 
		avatar_url: 'https://some.amazon.url',
		blocked: ['1', '2','3'],
		friends: ['123', '321'],
		friend_requests: [{ user_id: '1234', date: new Date().toString() }],
		requested_friends: [{ user_id: '3234', date: new Date().toString() }]
	};

	describe('AUTHENTICATED GET /me', () => {

		describe('with an authenticated user', () => {
			it('responds with a full representation of the user', async () => {
				let user = await User.create(_.merge({password: '123456'}, props));
				let auth = await Auth.createByCredentials({email: props.email, password: '123456'});

				let resp = await API.get('/users/me', null, {Authorization: `Bearer ${auth.get('token')}` });

				expect(resp.statusCode).to.be(200);
				
				Object.getOwnPropertyNames(props).forEach((k) => {
					expect(resp.body.user[k]).to.eql(props[k])
				});
			});
		});
	});

	describe('AUTHENTICATED GET /:name', () => {
		describe('with an authenticated user', () => {
			it('responds with an abbreviated representation of the user', async () => {
				let user = await User.create(_.merge({password: '123456'}, props));
				let requester = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
				let auth = await Auth.createByCredentials({email: props.email, password: '123456'});

				let resp = await API.get('/users/a', null, {Authorization: `Bearer ${auth.get('token')}` });
				expect(resp.statusCode).to.be(200);
				expect(resp.body.user).to.eql({
					name: 'a',
					display_name: 'Wow!',
					avatar_url: props.avatar_url,
					bio: props.bio
				});
			});
		});
	});


	describe('POST / {user : {email, name, password} }', () => {
		describe('with all required params', () => {
			it('responds with a new user', async () => {
				let params = { 
					user: {
						email: 'e@p.com',
						name: 'somename',
						password: '123456'
					}
				};

				let resp = await API.post('/users', params);

				expect(resp.statusCode).to.be(201);
				expect(resp.body.user._id).to.be.ok();
				expect(resp.body.user.email).to.be(params.user.email);
				expect(resp.body.user.name).to.be(params.user.name);
				expect(resp.body.user.password).to.not.be.ok();
				expect(resp.body.user.password_hash).to.not.be.ok();
				expect(resp.body.user.display_name).to.be.ok();
				expect(resp.body.user.bio).to.not.be.ok();
				expect(resp.body.user.post_visibility).to.be(1);
				expect(resp.body.user.old_post_visibility).to.be(0);
			});
		});

		describe('with a required param missing', () => {
			it('responds with a 400 and error messages', async () => {
				let params = {user: {}};
				let resp = await API.post('/users', params);
				expect(resp.statusCode).to.be(400);
				expect(resp.body.errors[0]).to.eql({ type: 'RecordInvalid', messages: [ 'email must be a valid email address', 'name must be present', 'password must be present for new users','password_hash must be present', 'display_name must be at least 1 character', 'display_name must be a string']});
			});
		});

		describe('with a non-unique property', () => {
			it('responds with a 400', async () => {
				let props = {name: 'hey', email: 'e@p.com', password: '123456'}
				await User.create(props);
				let resp = await API.post('/users', {user: props});
				expect(resp.statusCode).to.be(400);
				expect(resp.body.errors[0].type).to.be('RecordInvalid');
			});
		});
	});

	describe('AUTHENTICATED POST /users/me { user: {...props}', () => {
		let user;
		let auth;
		let props = {name:'hey', email: 'e@p.com', password: '123456'};
		let headers = {}
		beforeEach(async () => {
			user = await User.create(props);
			auth = await Auth.createByCredentials(props);
			headers.Authorization = `Bearer ${auth.get('token')}`;
		});

		it('can set the user\'s avatar_url', async () => {
			let avatar_url = 'https://some.aws.url';
			let resp = await API.post('/users/me', { user: { avatar_url: avatar_url}}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.avatar_url).to.be(avatar_url);
		});

		it('can update the user\'s name', async () => {
			let new_name = 'woahheywhat';
			let resp = await API.post('/users/me', { user: { name: new_name }}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.name).to.be(new_name);
		});

		it('can update the user\'s email', async () => {
			let new_email = 'email@email.com';
			let resp = await API.post('/users/me', { user: { email: new_email }}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.email).to.be(new_email);
		});

		it('can update the user\'s password', async () => {
			let hash = user.get('password_hash');
			let resp = await API.post('/users/me', {user: { password: '456789'}}, headers);
			expect(resp.statusCode).to.be(200);

			let u2 = await User.find(user.get('_id'));
			expect(u2.get('password_hash')).not.be(hash);
		});

		it('can update the user\'s bio', async () => {
			let new_bio = 'Wow what a wonderful bio. Just so good!';
			let resp = await API.post('/users/me', { user: { bio: new_bio }}, headers);
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.bio).to.be(new_bio);
		});

		it('can update the user\'s privacy settings', async () => {
			let resp = await API.post('/users/me', { user: { post_visibility: 0, old_post_visibility: 1}}, headers);
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.post_visibility).to.be(0);
			expect(resp.body.user.old_post_visibility).to.be(1);
		});

		describe('with no auth token', async () => {
			it('responds with a 401', async () => {
				let resp = await API.post('/users/me', {user: {name: 'butt'}});
				expect(resp.statusCode).to.be(401);
			});
		});
	});

	describe('AUTHENTICATED POST /users/:name/block', () => {
		it('adds the user to current user\'s block list', async () => {
			let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
			let blocked = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
			let auth = { Authorization: `Bearer ${(await Auth.createByCredentials({email: 'a@b.com', password: '123456'})).get('token')}`};

			let resp = await API.post('/users/b/block', {}, auth);

			expect(resp.statusCode).to.be(201);
			await user.reload();
			expect(user.get('blocks').includes(blocked.get('_id').toString())).to.be.ok();
		});

		describe('if the user does not exist', () => {
			it('raises a 404', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				let auth = { Authorization: `Bearer ${(await Auth.createByCredentials({email: 'a@b.com', password: '123456'})).get('token')}`};

				let resp = await API.post('/users/b/block', {}, auth);
				expect(resp.statusCode).to.be(404);
			});
		});
	});

	describe('AUTHENTICATED POST /users/:name/friend_requests', () => {
		describe('when the users are not friends yet', () => {

			describe('with an existing friend request from the requester to the indicated user', () => {
				it('responds with a 420', async () => {
					let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
					let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
					await requested.requestFriendship(user.get('_id'));
					let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
					let resp = await API.post(`/users/${requested.get('name')}/friend_requests`, {}, { Authorization: `Bearer ${auth.get('token')}`});
					expect(resp.statusCode).to.be(420);
				});
			});

			it('adds a friend_request to the indicated user and a requested_friend to the requesting user', async () => {
					let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
					let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
					let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
					let resp = await API.post(`/users/${requested.get('name')}/friend_requests`, {}, { Authorization: `Bearer ${auth.get('token')}`});
					expect(resp.statusCode).to.be(201);
					await user.reload();
					expect(user.get('requested_friends').length).to.be(1);
					await requested.reload();
					expect(requested.get('friend_requests').length).to.be(1);
			});
		});

		describe('when the users are already friends', () => {
			it('responds with a 420', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
				await requested.requestFriendship(user.get('_id'))
				await requested.befriend(user.get('_id'));
				let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
				let resp = await API.post(`/users/${requested.get('name')}/friend_requests`, {}, { Authorization: `Bearer ${auth.get('token')}`});
				expect(resp.statusCode).to.be(420);

			});
		});
	});

	describe('AUTHENTICATED POST /users/me/friend_requests/:user_id/accept', () => {
		describe('with an existing friend request from the indicated user', () => {
			it('adds the user as a friend, and removes the friend request/requested friend', async () => {
					let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
					let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
					await requested.requestFriendship(user.get('_id'));
					let auth = await Auth.createByCredentials({email: 'b@a.com', password: '123456'});
					let resp = await API.post(`/users/me/friend_requests/${user.get('_id')}/accept`, {}, { Authorization: `Bearer ${auth.get('token')}`});
					expect(resp.statusCode).to.be(201);
					await user.reload();
					expect(user.get('friends').includes(requested.get('_id').toString())).to.be.ok();
					expect(user.get('requested_friends')).to.be.empty();
					await requested.reload();
					expect(requested.get('friends').includes(user.get('_id').toString())).to.be.ok();
					expect(requested.get('friend_requests')).to.be.empty();
			});
		});

		describe('with no existing friend request from the indicated user', () => {
			it('responds with a 400', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
				let auth = await Auth.createByCredentials({email: 'b@a.com', password: '123456'});
				let resp = await API.post(`/users/me/friend_requests/${user.get('_id')}/accept`, {}, { Authorization: `Bearer ${auth.get('token')}`});
				expect(resp.statusCode).to.be(400);
			});
		});
	});

	describe('AUTHENTICATED POST /users/me/friend_requests/:user_id/ignore', () => {
		describe('with an existing friend request from the indicated user', () => {
			it('adds the user as a friend, and removes the friend request/requested friend', async () => {
					let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
					let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
					await requested.requestFriendship(user.get('_id'));
					let auth = await Auth.createByCredentials({email: 'b@a.com', password: '123456'});
					let resp = await API.post(`/users/me/friend_requests/${user.get('_id')}/ignore`, {}, { Authorization: `Bearer ${auth.get('token')}`});
					expect(resp.statusCode).to.be(201);
					await user.reload();
					expect(user.get('requested_friends')).to.be.empty();
					await requested.reload();
					expect(requested.get('friend_requests')).to.be.empty();
			});
		});

		describe('with no existing friend request from the indicated user', () => {
			it('responds with a 400', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				let requested = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
				let auth = await Auth.createByCredentials({email: 'b@a.com', password: '123456'});
				let resp = await API.post(`/users/me/friend_requests/${user.get('_id')}/ignore`, {}, { Authorization: `Bearer ${auth.get('token')}`});
				expect(resp.statusCode).to.be(400);
			});
		});
	});
});