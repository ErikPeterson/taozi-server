'use strict';

const expect = require('expect.js');
const RecordNotFound = require('../../../models/errors/record_not_found');

describe('RecordNotFound', () => {
	describe('constructor(class_name, _id)', () => {
		it('returns a new instance of RecordNotFound', () => {
			let err = new RecordNotFound('FakeModel', {_id: 1234});
			expect(err.message).to.match(/could not find FakeModel with query={"_id":1234}/)
			expect(err.status).to.be(404);
		});
	});
});