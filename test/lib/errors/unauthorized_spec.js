'use strict';

const expect = require('expect.js');
const Unauthorized = require('../../../lib/errors/unauthorized');

describe('Unauthorized', () => {
	describe('constructor(message)', () => {
		it('returns an instance of Unauthorized', () => {
			let err = new Unauthorized('wow so unauthorized');
			expect(err.status).to.be(401);
			expect(err.message).to.be('wow so unauthorized');
			expect(err.toJSON()).to.eql({
				type: 'Unauthorized',
				messages: ['wow so unauthorized']
			})
		});
	})
})