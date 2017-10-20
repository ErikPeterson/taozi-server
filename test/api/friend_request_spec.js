'use strict';

const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');
const sinon = require('sinon');

const Auth = require('../../models/auth');

describe('/friend_requests', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('AUTHENTICATED GET /', () => {
		let user;
		let requesters;
		let params;
		let path;

		beforeEach()
	});

	describe('AUTHENTICATED POST /', () => {
		let requested_user;
		let requesting_user;
		let params;
		let path;

		beforeEach(async () => {
			requested_user = await User.create({email: 'a@b.com', name: 'followed', password: '123456'});
			requesting_user = await User.create({email: 'b@a.com', name: 'follower', password: '12345600'});
			params = {friend_request: { 
				requested_name: requested_user.get('name')
				}};
			path = `/friend_requests`; 
		});

		describe('with the requesting user logged in', () => {
			let auth;

			beforeEach(async () =>{
				auth = await Auth.createByCredentials({email: 'b@a.com', password: '12345600'});
			});

			it('creates a new friend request', async () => {

				let headers = {
					'Authorization': `Bearer ${auth.get('token')}`
				};

				let resp = await API.post(path, params, headers);
				expect(resp.statusCode).to.be(201);
				expect(resp.body.friend_request.requesting_user_id).to.eql(requesting_user.get('_id').toString());
				expect(resp.body.friend_request.requested_user_id).to.eql(requested_user.get('_id').toString());
				expect(resp.body.friend_request.accepted_at).to.not.be.ok();
			});

			describe('when the requested user does not exist', () => {
				it('responds with a 400', async () => {

					let headers = {
						'Authorization': `Bearer ${auth.get('token')}`
					};

					let resp = await API.post(path, { friend_request: { requested_name: 'what' } }, headers);
					expect(resp.statusCode).to.be(400);
					expect(resp.body.errors[0].messages[0]).to.be('the requested user does not exist');
				});
			});
		});

		describe('with no user logged in', () => {
			it('responds with a 401', async () => {
				let resp = await API.post(path, params);

				expect(resp.statusCode).to.be(401);
			});
		});
	});

});