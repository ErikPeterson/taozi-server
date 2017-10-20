'use strict';

class BadRequest extends Error{
	toJSON(){
		return {
			type: 'BadRequest',
			messages: [this.message]
		}
	}

	get status(){
		return 400;
	}
}

module.exports = BadRequest;