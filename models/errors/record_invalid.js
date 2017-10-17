'use strict';

class RecordInvalid extends Error{
	constructor(instance, errors){
		super(errors.short_message);
		this.instance = instance;
		this.errors = errors;
	}

	toJSON(){
		return {
			type: 'RecordInvalid',
			messages: this.full_messages
		}
	}

	get full_messages(){
		return this.errors.full_messages;
	}

	get status(){
		return 400;
	}
}

module.exports = RecordInvalid;