'use strict';

const BaseModel = require('./base');

class Post extends BaseModel {
	static get column_name(){ return 'posts' };
	static get read_only(){ return true };
	static get before_validate(){ return ['_validate_user_id']}
	static get after_validate(){ return ['_validate_body'] };
	static get before_create(){ return ['_set_created_at'] };

	static get renderable_attributes(){ return ['body', 'created_at', 'user_id', '_id', 'comment_count', 'like_count']};

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

	async incrementCommentCount(){
		let count = this.get('comment_count') || 0;
		count++;
		this.set('comment_count', count);
		if(!this.new_record) await this.save(true);
		return count;
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
			comment_count: 1,
			like_count: 1
		}
	}
}

module.exports = Post;