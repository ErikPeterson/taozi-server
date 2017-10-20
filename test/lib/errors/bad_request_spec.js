'use strict';

const expect = require('expect.js');
const BadRequest = require('../../../lib/errors/bad_request');

describe('BadRequest', () => {
	describe('constructor(message)', () => {
		it('returns an instance of BadRequest', () => {
			let err = new BadRequest('wow so bad_request');
			expect(err.status).to.be(400);
			expect(err.message).to.be('wow so bad_request');
			expect(err.toJSON()).to.eql({
				type: 'BadRequest',
				messages: ['wow so bad_request']
			})
		});
	})
})