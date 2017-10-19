'use strict';

const expect = require('expect.js');
const crypto = require('crypto');
const getToken = require('../../lib/get_token');
const sinon = require('sinon');

describe('async getToken()', () => {
	it('returns a token', async () => {
		let token = await getToken();
		expect(token).to.be.ok();
	});

	it('raises any crypto errors', async () => {
		let stub = sinon.stub(crypto, 'randomBytes').callsFake((b, cb) => {
			return cb(new Error('err'), '');
		});

		try{
			await getToken();
			expect().fail();
		} catch(e){
			expect(e.message).to.be('err');
		}
		
		stub.restore();
		
	});

});