'use strict';

const expect = require('expect.js');
const comparePassword = require('../../lib/compare_password');
const hashPassword = require('../../lib/hash_password');

describe('async comparePassword(password, password_hash)', () => {
	it('returns true if the password and hash match', async () => {
		let password = '12345tvwp';
		let hash = await hashPassword(password);
		let match = await comparePassword(password, hash);
		expect(match).to.be.ok();
	});

	it('returns false if the password and has do not match', async () => {
		let password = '12345tvwp';
		let hash = await hashPassword(password);
		let match = await comparePassword('123', hash);
		expect(match).to.not.be.ok();
	});
});