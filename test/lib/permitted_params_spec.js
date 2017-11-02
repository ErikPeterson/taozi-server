'use strict';

const expect = require('expect.js');
const permittedParams = require('../../lib/permitted_params');
const Parameters = require('strong-params').Parameters;

describe('async permittedParams(ctx, next)', () => {
	it('adds params to ctx from request body', async () => {
		let ctx = {
			request: {
				body: {
					my: 'body!'
				}
			}
		};
		let called = false;
		let next = async () => { called = true };

		await permittedParams(ctx, next);

		expect(called).to.be.ok();
		expect(ctx.request.params).to.be.a(Parameters);
		expect(ctx.request.params.permit('my').value()).to.eql({'my': 'body!'})
	});
});