'use strict';

const PROPERTY_REGEX = /index: (\S+) /;
const parseProperty = (message) => {
	return message.match(PROPERTY_REGEX)[1];
}

class DuplicatePropertyError extends Error {
	constructor(mongo_error){
		super();
		this.original_error = mongo_error;
	}

	get message() {
		return `${this.property} must be unique`;
	}

	get property() {
		this._property = this._property || parseProperty(this.original_error.message);
		return this._property;
	}
}

module.exports = DuplicatePropertyError;