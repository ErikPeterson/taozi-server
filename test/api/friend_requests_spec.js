'use strict';

const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');
const FriendRequest = require('../../models/friend_request')
const Auth = require('../../models/auth');
const faker = require('faker');

describe('/friend_requests', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('AUTHENTICATED GET /', () => {
		let user;
		let requests;
		let auth;
		let headers = {};

		describe('when the user has friend requests', () => {
			beforeEach(async () => {
				try{
				user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
			} catch(e){ console.log(e.full_messages)}
				auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
				headers.Authorization = `Bearer ${auth.get('token')}`;
				requests = [];
				for(let i = 0; i < 5; i++){
					let requester = await User.create({email: faker.internet.email(), name: faker.internet.userName().replace(/[^0-9aA-zZ_]/, ''), password: '123456'});
					let request = await FriendRequest.create({requesting_user_id: requester.get('_id').toString(), requested_user_id: user.get('_id').toString()})
					requests.push(request);
				}
			});

			it('responds with all of the friend requests that have not yet been accepted', async () => {
				let resp = await API.get('/friend_requests', null, headers);
				expect(resp.statusCode).to.be(200);
				expect(resp.body.friend_requests.length).to.be(5);
			});
		});

		describe('when the user has no friend requests', () => {
			it('returns an empty array', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});

				let resp = await API.get('/friend_requests', null, {'Authorization' : `Bearer ${auth.get('token')}`});

				expect(resp.body.friend_requests).to.be.empty();
			});
		});
	});

	describe('AUTHENTICATED POST / {friend_request: {requested_name}}', () => {
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

	describe('AUTHENTICATED POST /friend_requests/:id {friend_request: {accepted_at}}', () => {
			
		let user;
		let auth;
		let friend_request;
		let headers;
		let path;
		let body;

		beforeEach(async () => {
			user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
			friend_request = await FriendRequest.create({requested_user_id: user.get('_id').toString(), requesting_user_id: '123'});
			auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
			headers = { Authorization: `Bearer ${auth.get('token')}` };
			path = `/friend_requests/${friend_request.get('_id')}`;
			body = { friend_request: { accepted: true }}
		});

		describe('with a friend request owned by the logged in user', () => {

			it('can set the friend_request\'s accepted attribute', async () => {
				let resp = await API.post(path, body, headers);
				expect(resp.statusCode).to.be(200);
				expect(resp.body.friend_request).to.eql({
					_id: friend_request.get('_id').toString(),
					requested_user_id: user.get('_id').toString(),
					requesting_user_id: '123',
					accepted: true
				});
			});

			describe('with a friend request that has already been accepted', () => {
				it('responds with a 400 error', async () => {
					await friend_request.update({accepted: true});
					let resp = await API.post(path, body, headers);
					expect(resp.statusCode).to.be(400);
					expect(resp.body.errors[0].messages[0]).to.match(/cannot be changed once set/);
				});
			})
		});

		describe('with a friend request that exists, but is not owned by the logged in user', () => {
			it('responds with  403 error', async () => {
				let friend_request_2 = await FriendRequest.create({requesting_user_id: '1234',requested_user_id: '12345'});
				path = `/friend_requests/${friend_request_2.get('_id')}`;
				let resp = await API.post(path, body, headers);
				expect(resp.statusCode).to.be(403);
			});
		})
	});

});