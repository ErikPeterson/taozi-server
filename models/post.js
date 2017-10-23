'use strict';

const BaseModel = require('./base');

class Post extends BaseModel {
	static get column_name(){ return 'posts' };
	static get read_only(){ return true };
	static get before_validate(){ return ['_validate_user_id']}
	static get after_validate(){ return ['_validate_body'] };
	static get before_create(){ return ['_set_created_at'] };

	_validate_user_id(){
		if(!this.get('user_id')) this.errors.add('user_id', 'must be present');
	}

	_validate_body(){
		if(this.errors.data.body) return;
		let body = this.get('body');
		if(body.some((m) =>  typeof m !== 'object' || !m.type )) this.errors.add('body', 'modules must all be objects containing a type member');
	}

	_set_created_at(){
		this.set('created_at', new Date());
	}

	static get schema(){
		return {
			user_id: '',
			body: [],
			created_at: new Date()
		}
	}
}

module.exports = Post;