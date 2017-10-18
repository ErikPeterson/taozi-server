'use strict';

class RecordIsReadOnly extends Error{
	constructor(record){
		super();
		this.record = record;
	}

	get message(){
		return `\`${this.record.constructor.name}' cannot be altered after creation`;
	}

	get status(){
		return 400;
	}

	toJSON(){
		return { type: 'RecordIsReadOnly', messages: [this.message]}
	}
}

module.exports = RecordIsReadOnly;