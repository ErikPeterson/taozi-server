'use strict';

const expect = require('expect.js');
const IncreaseYourChill = require('../../../lib/errors/increase_your_chill');

describe('IncreaseYourChill', () => {
	describe('constructor(message)', () => {
		it('returns an instance of IncreaseYourChill', () => {
			let err = new IncreaseYourChill('too fast, slick');
			expect(err.status).to.be(420);
			expect(err.message).to.be('too fast, slick');
			expect(err.toJSON()).to.eql({
				type: 'IncreaseYourChill',
				messages: ['too fast, slick']
			})
		});
	})
})