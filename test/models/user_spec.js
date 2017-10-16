'use strict';

const expect = require('expect.js');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');

describe('User', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('validations', () => {
		describe('email', () => {
			it('must be unique', async () => {
				let props = {email: 'b@a.com', name: 'a name', password: 'whatever'};

				await User.create(props);

				try {
					props.name = 'name';
					await User.create(props);
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/email is not valid/);
				}

			});

			it('must be a valid email', async () => {
				try {
					await User.create({email: 'b', name: 'aname', password: '123456'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/email is not valid/);
				}
			});
		});

		describe('name', () => {
			it('must be present', async () => {
				try{
					await User.create({email: 'a@b.com', password: '123456'});
					expect().error();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name/)
				}

				let user = await User.create({email: 'a@b.com', password: '123456', name: 'hey'});
				user.set('name', undefined);
				try {
					await user.save()
					expect().error()
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name/)
				}
			});

			it('must be unique', async () => {
				let props = {email: 'b@a.com', name: 'a name', password: 'whatever'};
				await User.create(props);
				try {
					props.email = 'a@b.com';
					await User.create(props);
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name is not valid/);
				}
			});
		});

		describe('password', () => {
			it('must be present when creating a new record', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'a name'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/password is not valid/);
				}
			});

			it('must be at least 6 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'a name', password: '1234'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.errors.full_messages[0]).to.match(/must be at least 6 characters/);
				}
			});

			it('is transformed into password_hash, and unset after save', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a name', password: '123456'});
				expect(user.get('password')).to.be(undefined);
				expect(user.get('password_hash')).to.be.ok();
			});
		});
	});
});