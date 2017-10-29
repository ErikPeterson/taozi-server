'use strict';

const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');
const sinon = require('sinon');

const Auth = require('../../models/auth');

describe('/users', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
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

	describe('AUTHENTICATED POST /users/:name { user: {...props}', () => {
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
			let resp = await API.post('/users/hey', { user: { avatar_url: avatar_url}}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.avatar_url).to.be(avatar_url);
		});

		it('can update the user\'s name', async () => {
			let new_name = 'woahheywhat';
			let resp = await API.post('/users/hey', { user: { name: new_name }}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.name).to.be(new_name);
		});

		it('can update the user\'s email', async () => {
			let new_email = 'email@email.com';
			let resp = await API.post('/users/hey', { user: { email: new_email }}, headers);
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.email).to.be(new_email);
		});

		it('can update the user\'s password', async () => {
			let hash = user.get('password_hash');
			let resp = await API.post('/users/hey', {user: { password: '456789'}}, headers);
			expect(resp.statusCode).to.be(200);

			let u2 = await User.find(user.get('_id'));
			expect(u2.get('password_hash')).not.be(hash);
		});

		it('can update the user\'s bio', async () => {
			let new_bio = 'Wow what a wonderful bio. Just so good!';
			let resp = await API.post('/users/hey', { user: { bio: new_bio }}, headers);
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.bio).to.be(new_bio);
		});

		it('can update the user\'s privacy settings', async () => {
			let resp = await API.post('/users/hey', { user: { post_visibility: 0, old_post_visibility: 1}}, headers);
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.post_visibility).to.be(0);
			expect(resp.body.user.old_post_visibility).to.be(1);
		});

		describe('when no user with the specified name exists', async () => {
			it('responds with a 403', async () => {
				let resp = await API.post('/users/what', {user: {name: 'huh'}}, headers);
				expect(resp.statusCode).to.be(403);
			});
		});

		describe('with no auth token', async () => {
			it('responds with a 401', async () => {
				let resp = await API.post('/users/hey', {user: {name: 'butt'}});
				expect(resp.statusCode).to.be(401);
			});
		});

		describe('with an auth token for the wrong user', async () => {
			it('responds with a 403', async () => {
				let user2 = await User.create({name: 'butt', email: 'butt@butt.com', password: '1234567'});
				let auth2 = await Auth.createByCredentials({email: 'butt@butt.com', password: '1234567'});

				let resp = await API.post('/users/hey', {user: {name: 'whatever'}}, {'Authorization': `Bearer ${auth2.get('token')}` });
				expect(resp.statusCode).to.be(403);
			});
		});
	});
});