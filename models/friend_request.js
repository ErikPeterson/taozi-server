'use strict';

const BaseModel = require('./base.js');
const ERR_REG = /must be unique$/

class FriendRequest extends BaseModel{
	static get column_name(){ return 'friend_requests'; }
	static get before_validate(){ return ['_validate_user_ids', '_validate_accepted']; }
	static get after_validate(){ return ['_munge_scope_error']; }

	_validate_accepted(){
		let changed = this._changes.accepted !== undefined;
		let set = this._attributes.accepted !== undefined;
		if(!set && !changed) return;
		if(!this.new_record && set && changed) return this.errors.add('accepted', 'cannot be changed once set');
		let at = this.get('accepted');
		if(at !== true && at !== null) this.errors.add('accepted', 'must be true or null');
	}

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

	static get renderable_attributes(){ return ['_id', 'requesting_user_id', 'requested_user_id', 'accepted'];}
	static get schema(){
		return {
			requesting_user_id: '',
			requested_user_id: '',
			accepted: true
		}
	}
}

module.exports = FriendRequest;