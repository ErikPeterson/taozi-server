'use strict';

const expect = require('expect.js');
const RecordInvalid = require('../../../models/errors/record_invalid');
const FakeModel = require('../../support/fake_model');

describe('RecordInvalid', () => {
	describe('constructor(instance, errors)', () => {
		it('instantiates a new RecordInvalid error', () => {
			let inst = new FakeModel({name: 1});
			inst.validate();
			let err = new RecordInvalid(inst, inst.errors);
			expect(err.instance).to.be(inst);
			expect(err.errors).to.be(err.errors);
			expect(err.full_messages).to.eql(err.errors.full_messages);
			expect(err.message).to.eql(err.errors.short_message);
		});
	});
});
