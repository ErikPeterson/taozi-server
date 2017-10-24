'use strict';

const BaseModel = require('./base');

class Comment extends BaseModel {
	static get column_name() { return 'comments' };
	static get read_only(){ return true };
	static get before_validate(){ return ['_set_created_at'] };
	static get after_validate(){ return ['_validate_user_id', '_validate_text', '_validate_post_id']};
	static get renderable_attributes(){ return ['_id', 'user_id', 'text', 'post_id', 'created_at']};

	_validate_user_id(){
		if(!this.get('user_id')) this.errors.add('user_id', 'must be present');
	}
	
	_validate_text(){
		if(!this.get('text')) this.errors.add('text', 'must be present');
	}
	
	_validate_post_id(){
		if(!this.get('post_id')) this.errors.add('post_id', 'must be present');
	}


	_set_created_at(){
		this.set('created_at', new Date());
	}

	static get schema(){
		return {
			user_id: '',
			text: '',
			post_id: '',
			created_at: new Date()
		}
	}
}

module.exports = Comment;