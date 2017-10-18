'use strict';

const crypto = require('crypto');

module.exports = async () => {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(48, (err, buf) => {
			if(err) throw err;
			return resolve(buf.toString('hex'));
		});
	});
}