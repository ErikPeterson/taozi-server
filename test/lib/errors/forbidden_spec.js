'use strict';

const expect = require('expect.js');
const Unauthorized = require('../../../lib/errors/forbidden');

describe('Forbidden', () => {
	describe('constructor(message)', () => {
		it('returns an instance of Forbidden', () => {
			let err = new Unauthorized('wow so forbidden');
			expect(err.status).to.be(403);
			expect(err.message).to.be('wow so forbidden');
			expect(err.toJSON()).to.eql({
				type: 'Forbidden',
				messages: ['wow so forbidden']
			})
		});
	})
})