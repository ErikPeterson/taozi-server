'use strict';

class Forbidden extends Error{
	constructor(message){
		super(message);
	}

	toJSON(){
		return {
			type: 'Forbidden', 
			messages: [this.message]
		};
	}

	get status(){ return 403; }
}

module.exports = Forbidden;