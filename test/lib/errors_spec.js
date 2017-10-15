'use strict';

const expect = require('expect.js');
const Errors = require('../../lib/errors');

describe('Errors', ()=>{
	describe('#add(prop, message)', ()=>{
		it('adds the specified message for the specified value', () => {
			let errors = new Errors();
			expect(Object.getOwnPropertyNames(errors.data).length).to.be(0);
			errors.add('some_prop', 'Is bad');
			expect(errors.data.some_prop[0]).to.be('Is bad');
			errors.add('some_prop', 'Is REALLY bad');
			expect(errors.data.some_prop[1]).to.be('Is REALLY bad');
		});
	});

	describe('#empty', ()=>{
		it('returns true if no errors are set', () => {
			let errors = new Errors();
			expect(errors.empty).to.be(true);
		});

		it('returns false if any errors are set', () => {
			let errors = new Errors();
			errors.add('some_prop', 'is bad');
			expect(errors.empty).to.be(false);
		})
	});

	describe('#clear()', () => {
		it('clears all messages and properties', () => {
			let errors = new Errors();
			errors.add('this_prop', 'is all messed up');
			expect(errors.empty).to.be(false);
			errors.clear();
			expect(errors.empty).to.be(true);
		});
	});

	describe('#full_messages', () => {
		it('returns an array of messages describing errors', ()=>{
			let errors = new Errors();
			expect(errors.full_messages.length).to.be(0);
			errors.add('some_prop', 'is bad');
			expect(errors.full_messages[0]).to.be('some_prop is bad');
		});
	});

	describe('#short_message', () => {
		it('returns a short summary of the errors', ()=>{
			let errors = new Errors();
			errors.add('butt', 'is bad');
			errors.add('butt', 'is also the wrong format');
			expect(errors.short_message).to.match(/butt is not valid/);
			errors.add('some_prop', 'stinks');
			expect(errors.short_message).to.match(/butt, some_prop are not valid/);
		});
	});
});