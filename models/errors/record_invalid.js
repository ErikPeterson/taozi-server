'use strict';

class RecordInvalid extends Error{
	constructor(instance, errors){
		super(errors.short_message);
		this.instance = instance;
		this.errors = errors;
	}

	get full_messages(){
		return this.errors.full_messages;
	}
}

module.exports = RecordInvalid;