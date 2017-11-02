'use strict';

const expect = require('expect.js');
const faker = require('faker');
const hashPhoneNumber = require('../../lib/hash_phone_number');

describe('hashPhoneNumber(number)', () => {
	it('number goes in hash comes out', () => {
		let number = faker.phone.phoneNumber();
		let hash = hashPhoneNumber(number);
		expect(hash).to.be.ok()
		let hash2 = hashPhoneNumber(number);
		expect(hash).to.eql(hash2);
	});
});
