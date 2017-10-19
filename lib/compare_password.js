'use strict';

const bcrypt = require('bcrypt');

module.exports = (password, password_hash) => {
	return bcrypt.compare(password, password_hash);
};