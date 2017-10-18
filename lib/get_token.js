'use strict';

const randomBytes = require('crypto').randomBytes;

module.exports = async () => {
	return new Promise((resolve, reject) => {
		randomBytes(48, (err, buf) => {
			if(err) return reject(err);
			return resolve(buf.toString('hex'));
		});
	});
}