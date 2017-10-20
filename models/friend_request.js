'use strict';

const BaseModel = require('./base.js');
const ERR_REG = /must be unique$/

class FriendRequest extends BaseModel{
	static get column_name(){ return 'friend_requests'; }
	static get before_validate(){ return ['_validate_user_ids']; }
	static get after_validate(){ return ['_munge_scope_error']; }

	_validate_user_ids(){
		if(!this.get('requesting_user_id')) this.errors.add('requesting_user_id', 'must be present');
		if(!this.get('requested_user_id')) this.errors.add('requested_user_id', 'must be present');
	}

	_munge_scope_error(){
		let err = this.errors.data['.requested_user_id'];
		if(!err) return;
		delete this.errors.data['.requested_user_id'];
		this.errors.add('requested_user_id', 'must be unique within the scope of `requesting_user_id\'');
	}

	static get renderable_attributes(){ return ['_id', 'requesting_user_id', 'requesting_user_id', 'accepted_at'];}
	static get schema(){
		return {
			requesting_user_id: '',
			requested_user_id: '',
			accepted_at: ''
		}
	}
}

module.exports = FriendRequest;