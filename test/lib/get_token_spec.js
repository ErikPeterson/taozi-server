'use strict';

const expect = require('expect.js');
const getToken = require('../../lib/get_token');

describe('async getToken()', () => {
	it('returns a token', async () => {
		let token = await getToken();
		expect(token).to.be.ok();
	})
});