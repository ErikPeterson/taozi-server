'use strict';

const hashPassword = require('../../lib/hash_password');
const expect = require('expect.js');
const bcrypt = require('bcrypt');

describe('async hashPassword(password)', () => {
	it('returns the password, hashed', async () => {
		let hashedPassword = await hashPassword('123456');
		let compared = await bcrypt.compare('123456', hashedPassword);
		expect(compared).to.be.ok();
	});
});