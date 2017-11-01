'use strict';

const BaseModel = require('./base');

class Post extends BaseModel {
	static get column_name(){ return 'posts' };
	static get read_only(){ return true };
	static get before_validate(){ return ['_validate_user_id', '_validate_comments']}
	static get after_validate(){ return ['_validate_body'] };
	static get before_create(){ return ['_set_created_at'] };
	static get renderable_attributes(){ return ['body', 'created_at', 'user_id', '_id', 'comments', 'like_count']};

	_validate_user_id(){
		if(!this.get('user_id')) this.errors.add('user_id', 'must be present');
	}

	_validate_body(){
		if(this.errors.data.body) return;
		let body = this.get('body');
		if(body.some((m) =>  typeof m !== 'object' || !m.type )) this.errors.add('body', 'modules must all be objects containing a type member');
	}

	_validate_comments(){
		let new_comments = this._changes['comments'];
		if(!new_comments || new_comments.length === 0) return;
		new_comments.forEach((c) => {
			if(!c.user_id || typeof c.user_id !== 'string') this.errors.add('comments', 'must have a user_id');
			if(!c.text || typeof c.text !== 'string') this.errors.add('comments', 'must have a valid text field');
			if(Object.getOwnPropertyNames(c).length > 2) this.errors.add('comments', 'must contain only user_id and text attributes');
		})
	}

	_set_created_at(){
		this.set('created_at', new Date());
	}

	async addComment(comment){
		let comments = this.get('comments') || [];
		comments.push(comment);
		this.set('comments', comments);
		await this.save(true);
	}

	async incrementLikeCount(){
		let count = this.get('like_count') || 0;
		count++;
		this.set('like_count', count);
		if(!this.new_record) await this.save(true);
		return count;
	}

	static get schema(){
		return {
			user_id: '',
			body: [],
			created_at: new Date(),
			like_count: 1,
			comments: []
		}
	}
}

module.exports = Post;