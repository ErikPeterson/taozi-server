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

	describe('POST /auth { user: { email, password} }', () => {
		let props = {name:'hey', email: 'e@p.com', password: '123456'};
		
		beforeEach(async () => {
			await User.create(props);
		});

		describe('with the correct email and password for a taozi user', () => {
			it('responds with 201 and an auth token', async () => {
				let resp = await API.post('/users/auth', {auth: {email: 'e@p.com', password: '123456'}});
				expect(resp.statusCode).to.be(201);
				expect(resp.body.auth.token).to.be.ok();
			});
		});

		describe('with incorrect or missing credentials', () => {
			it('responds with 401 and an error', async () => {
				let password = props.password;
				let resp = await API.post('/users/auth', {auth: {email: 'a@b.com', password: password}});
				expect(resp.statusCode).to.be(401);
				expect(resp.body.errors[0]).to.eql({type: 'Unauthorized', messages: ['no user with those credentials could be found']});
				let resp2 = await API.post('/users/auth', {auth: {email: 'e@p.com', password: '12345'}});
				expect(resp2.statusCode).to.be(401);
				expect(resp2.body.errors[0]).to.eql({type: 'Unauthorized', messages: ['no user with those credentials could be found']});
			});
		});

		describe('when a non auth related error occures', () => {

			beforeEach(function(){
				this.stub = sinon.stub(Auth, 'createByCredentials').callsFake(async () => { throw new Error('butt')});
			});

			it('reraises', async () => {
				let resp = await API.post('/users/auth', {auth: {email: 'e@p.com', password: '123456'}});
				expect(resp.statusCode).to.be(500);
				expect(resp.body.errors[0]).to.eql({type: 'Error', messages: ['butt']});
			});

			afterEach(function(){
				console.log('run');
				this.stub.restore();
			});
		})
	});
});