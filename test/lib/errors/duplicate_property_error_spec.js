'use strict';

const expect = require('expect.js');
const DuplicatePropertyError = require('../../../lib/errors/duplicate_property_error');

describe('DuplicatePropertyError', () => {
	describe('constructor(mongo_error)', () => {
		it('instantiates a new DuplicatePropertyError', () => {
			let err = new DuplicatePropertyError({ message: 'index: my.butt ' });
			expect(err.original_error).to.be.ok();
			expect(err.message).to.be('my.butt must be unique');
			expect(err.property).to.be('my.butt');
		});
	});
});