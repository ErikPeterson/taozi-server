'use strict';

const expect = require('expect.js');
const authenticateUser = require('../../lib/authenticate_user');
const Auth = require('../../models/auth');
const User = require('../../models/user');
const DB = require('../support/db_cleaner');

describe('authenticateUser(ctx, next)', () => {
	describe('with a valid auth token in ctx.headers', () => {
		let user;
		let auth;

		beforeEach(async () => {
			await DB.clean();
			let opts = {
				email: 'e@p.com',
				password: '123456',
				name: 'e'
			};

			user = await User.create(opts);
			auth = await Auth.createByCredentials(opts);
		});

		it('adds the authenticated user\s id to ctx.current_user_id', async () => {
			let ctx = {
				request: {
					headers: {
						authorization: `Bearer ${auth.get('token')}`
					}
				}
			};

			let next = async () => { expect(ctx.current_user_id).to.be(user.get('_id').toString())};

			await authenticateUser(ctx, next);
		});

		after(async () => {
			await DB.clean();
		});
	});

	describe('with no auth header', () => {
		it('throws an unauthorized', async () => {
			let ctx = {
				request: {
					headers: {},
					path: '/activity',
					method: 'POST'
				}
			};

			let next = async () => {};

			try{
				await authenticateUser(ctx, next);
				expect().fail();
			} catch(e) {
				expect(e.constructor.name).to.be('Unauthorized');
				expect(e.message).to.be(`POST /activity requires authentication`);
			}
		});
	});

	describe('with an incorrect auth token', () => {
		it('throws an unauthorized', async () => {
			let ctx = {
				request: {
					headers: {
						authorization: 'Bearer 1234'
					},
					path: '/activity',
					method: 'POST'
				}
			};

			let next = async () => {};

			try{
				await authenticateUser(ctx, next);
				expect().fail();
			} catch(e) {
				expect(e.constructor.name).to.be('Unauthorized');
				expect(e.message).to.be(`POST /activity requires authentication`);
			}

		});
	})
});