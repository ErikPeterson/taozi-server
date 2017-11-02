'use strict';

const createHash = require('crypto').createHash;

module.exports = (phone_number) => {
	let hash = createHash('sha256');
	hash.update(phone_number);
	return hash.digest('base64');
};
