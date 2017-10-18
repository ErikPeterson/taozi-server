'use strict';

const expect = require('expect.js');
const Auth = require('../../models/auth');
const User = require('../../models/user');
const DB = require('../support/db_cleaner');
const _ = require('lodash');

describe('Auth', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('validations', () => {
		let props = {
			user_id: '12345'
		};

		describe('token', () => {
			it('is set on create', async () => {
				let auth = await Auth.create(props);
				expect(auth.get('token')).to.be.ok();
			});
		});

		describe('user_id', async () => {
			it('must be present', async () => {
				try {
					await Auth.create(_.omit(props, 'user_id'));
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/user_id/)
				}
			});
		});

		describe('created_at', async () => {
			it('is set on create', async () => {
				let auth = await Auth.create(props);
				expect(auth.get('created_at')).to.be.ok();
			});
		});
	});

	describe('.createByCredentials({email, password})', () => {
		describe('if a user with these crendentials exists', async () => {
			it('returns an auth object', async () => {
				let user = await User.create({email: 'a@b.com', name:'a', password: '123456'});
				let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
				expect(auth).to.be.an(Auth);
				expect(auth.get('token')).to.be.ok();
				expect(auth.get('user_id')).to.be(user.get('_id').toString());
			});
		});
	});


});