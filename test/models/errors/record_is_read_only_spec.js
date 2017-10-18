'use strict';

const expect = require('expect.js');
const RecordIsReadOnly = require('../../../models/errors/record_is_read_only');
const FakeModel = require('../../support/fake_model');
const DB = require('../../support/db_cleaner');

describe('RecordIsReadOnly', () => {
	describe('constructor(instance)', () => {
		before(async () => {
			await DB.clean();
		});

		it('instantiates a new RecordIsReadOnly', async () => {
			let inst = await FakeModel.create({name: 'butt'});
			let err = new RecordIsReadOnly(inst);
			expect(err.status).to.be(400);
			expect(err.toJSON()).to.eql({ type: 'RecordIsReadOnly', messages: ['`FakeModel\' cannot be altered after creation']});
		});

		after(async () => {
			await DB.clean();
		});
	});
});