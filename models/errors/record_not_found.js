'use strict';

class RecordNotFound extends Error {
	constructor(class_name, query){
		super(`could not find ${class_name} with query=${JSON.stringify(query)}`);
		this.class = class_name;
		this.query = query;
	}
}

module.exports = RecordNotFound;