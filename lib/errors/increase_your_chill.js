'use strict';

class IncreaseYourChill extends Error{
	constructor(message){
		super(message);
	}

	toJSON(){
		return {
			type: 'IncreaseYourChill', 
			messages: [this.message]
		};
	}

	get status(){ return 420; }
}

module.exports = IncreaseYourChill;