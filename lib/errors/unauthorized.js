'use strict';

class Unauthorized extends Error{
	constructor(message){
		super(message);
	}

	toJSON(){
		return {
			type: 'Unauthorized', 
			messages: [this.message]
		};
	}

	get status(){ return 401; }
}

module.exports = Unauthorized;