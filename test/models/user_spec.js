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
				let props = {email: 'b@a.com', name: 'aname', password: 'whatever'};

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
				let props = {email: 'b@a.com', name: 'aname', password: 'whatever'};
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

			it('must be fewer than 23 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'xxxxxxxxxxxxxxxxxxxxxxx', password: '123456'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/22 characters or fewer/)
				}
			});

			it('must not contain any characters besides alphanumeric and _', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'xxxxxxxxxx xxxxxxxxxxx', password: '123456'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/may contain only alphanumeric characters and _/);
				}

			});
		});

		describe('password', () => {
			it('must be present when creating a new record', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'aname'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/password.* not valid/);
				}
			});

			it('must be at least 6 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'aname', password: '1234'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.errors.full_messages[0]).to.match(/must be at least 6 characters/);
				}
			});

			it('is transformed into password_hash, and unset after save', async () => {
				let user = await User.create({email: 'a@b.com', name: 'aname', password: '123456'});
				expect(user.get('password')).to.be(undefined);
				expect(user.get('password_hash')).to.be.ok();
			});
		});

		describe('password_hash', () => {
			it('must be present', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				user._unset('password_hash');
				try{
					await user.save();
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/password_hash/);
				}
			});
		});

		describe('bio', () => {
			it('must be 200 characters or fewer', async () => {
				try{
					await User.create({email: 'b@a.com', password: '123456', name: 'a', bio: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/200 characters or fewer/);
				}
			});
		});

		describe('display_name', () => {
			it('defaults to name', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				expect(user.get('display_name')).to.be('a');

				let user2 = new User({email: 'a@b.com', password: '123456'});

				try{
					await user2.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/display_name/);
				}
			});

			it('must be between fewer than 200 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'a', password: '123456', display_name: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'})
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/must be 200 characters or fewer/);
				}
			});
		})
	});

	describe('async #authenticate(password)', () => {
		describe('with the correct password', () => {
			it('returns true', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate('123456');
				expect(authentic).to.be.ok();
			});
		});

		describe('with no password', () => {
			it('returns false', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate();
				expect(authentic).to.not.be.ok();
			});
		});

		describe('with an incorrect password', () => {
			it('returns false', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate('12456');
				expect(authentic).to.not.be.ok();
			});
		});

		describe('with an unpersisted record', () => {
			it('returns false', async () => {
				let user = new User();
				let authentic = await user.authenticate('12345');
				expect(authentic).to.not.be.ok();
			});
		})
	});
});