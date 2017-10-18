'use strict';

const expect = require('expect.js');
const logger = require('../../lib/logger')().logger;
const catchErrors = require('../../lib/catch_errors')(logger);
const sinon = require('sinon');

describe('catchErrors(ctx, next)', () => {
	it('awaits next()', async () => {
		let next_called = false;
		let next = async () => { next_called = true};

		await catchErrors({}, next);
		expect(next_called).to.be.ok();
	});

	it('renders errors that have a toJSON method', async () => {
		let ctx = {};
		let err = new Error('hey');
		err.toJSON = () => {
			return {type: 'MyError', messages: ['what up']};
		}
		let next = async () => { throw err };

		await catchErrors(ctx, next);

		expect(ctx.body).to.eql({errors: [err.toJSON()]});
		expect(ctx.status).to.be(500);
	});

	it('renders errors that do not have a toJSON method', async () => {
		let ctx = {};
		let err = new Error('hello');
		err.status = 400;
		let next = async () => { throw err};
		await catchErrors(ctx, next);
		expect(ctx.status).to.be(400);
		expect(ctx.body).to.eql({errors: [{type: 'Error', messages: ['hello']}]})
	});
});