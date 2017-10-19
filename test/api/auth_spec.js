'use strict';

const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');
const sinon = require('sinon');

const Auth = require('../../models/auth');

describe('/auth', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});


	describe('POST / { auth: { email, password} }', () => {
		let props = {name:'hey', email: 'e@p.com', password: '123456'};
		
		beforeEach(async () => {
			await User.create(props);
		});

		describe('with the correct email and password for a taozi user', () => {
			it('responds with 201 and an auth token', async () => {
				let resp = await API.post('/auth', {auth: {email: 'e@p.com', password: '123456'}});
				expect(resp.statusCode).to.be(201);
				expect(resp.body.auth.token).to.be.ok();
			});
		});

		describe('with incorrect or missing credentials', () => {
			it('responds with 401 and an error', async () => {
				let password = props.password;
				let resp = await API.post('/auth', {auth: {email: 'a@b.com', password: password}});
				expect(resp.statusCode).to.be(401);
				expect(resp.body.errors[0]).to.eql({type: 'Unauthorized', messages: ['no user with those credentials could be found']});
				let resp2 = await API.post('/auth', {auth: {email: 'e@p.com', password: '12345'}});
				expect(resp2.statusCode).to.be(401);
				expect(resp2.body.errors[0]).to.eql({type: 'Unauthorized', messages: ['no user with those credentials could be found']});
			});
		});

		describe('when a non auth related error occures', () => {

			beforeEach(function(){
				this.stub = sinon.stub(Auth, 'createByCredentials').callsFake(async () => { throw new Error('butt')});
			});

			it('reraises', async () => {
				let resp = await API.post('/auth', {auth: {email: 'e@p.com', password: '123456'}});
				expect(resp.statusCode).to.be(500);
				expect(resp.body.errors[0]).to.eql({type: 'Error', messages: ['butt']});
			});

			afterEach(function(){
				this.stub.restore();
			});
		})
	});
});