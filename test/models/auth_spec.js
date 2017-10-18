'use strict';

const expect = require('expect.js');
const Auth = require('../../models/auth');
const User = require('../../models/user');
const DB = require('../support/db_cleaner');
const _ = require('lodash');
const mock = require('mock-require');

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

	describe('#_set_token()', () => {
		it('will skip any extant tokens', async () => {
			let i = 0;
			mock('../../lib/get_token', async () => {
				let token = i == 0 ? '1234' : '12345';
				i++;
				return token;
			});

			await DB.save('auths', {token: '1234'});

			let inst = new Auth();
			await inst._set_token();
			expect(inst.get('token')).to.be('12345');
			expect(i).to.be(2);
			mock.stopAll();
		});
	});

	describe('.createByCredentials({email, password})', () => {
		describe('if a user with these crendentials exists', () => {
			it('returns an auth object', async () => {
				let user = await User.create({email: 'a@b.com', name:'a', password: '123456'});
				let auth = await Auth.createByCredentials({email: 'a@b.com', password: '123456'});
				expect(auth).to.be.an(Auth);
				expect(auth.get('token')).to.be.ok();
				expect(auth.get('user_id')).to.be(user.get('_id').toString());
			});
		});

		describe('if a user with thise credentials does not exist', () => {
			it('raises an error', async () => {
				let user = await User.create({email: 'a@b.com', name:'a', password: '123456'});
				
				try{
					await Auth.createByCredentials({});
					expect().fail();
				} catch(e){
					expect(e.constructor.name).to.be('RecordInvalid');
				}

				try{
					await Auth.createByCredentials({email: 'a@b.com', password: 'butt'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});
	});


});