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
						name: 'some name',
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
			});
		});

		describe('with a required param missing', () => {
			it('responds with a 400 and error messages', async () => {
				let params = {user: {}};
				let resp = await API.post('/users', params);
				expect(resp.statusCode).to.be(400);
				expect(resp.body.errors[0]).to.eql({ type: 'RecordInvalid', messages: [ 'email must be a valid email address', 'name must be present', 'password must be present for new users','password_hash must be present']});
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
		
		beforeEach(async () => {
			user = await User.create(props);
			auth = await Auth.createByCredentials(props);
		});

		it('can set the user\'s avatar_url', async () => {
			let avatar_url = 'https://some.aws.url';
			let resp = await API.post('/users/hey', { user: { avatar_url: avatar_url}}, { 'Authorization': `Bearer ${auth.get('token')}`});
			
			expect(resp.statusCode).to.be(200);
			expect(resp.body.user.avatar_url).to.be(avatar_url);
		});
	});

});