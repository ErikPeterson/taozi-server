'use strict';

class Unauthorized extends Error{
	get status(){ return 401; }
}

module.exports = Unauthorized;