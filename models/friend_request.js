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

	static async friendIds(user_id){
		user_id = user_id.toString();
		let q = { $in: [user_id] }
		let result = await FriendRequest.where({$or: [{ requesting_user_id: q}, { requested_user_id: q}], accepted: true});
		let ids = result.reduce((a, r) => {
			let id1 = r.get('requesting_user_id');
			let id2 = r.get('requested_user_id');
			if(id1 !== user_id && !a.includes(id1)) a.push(id1);
			if(id2 !== user_id && !a.includes(id2)) a.push(id2);
			return a;
		}, []);

		return ids;	
	}

	static async areFriends(user_id_1, user_id_2){
		user_id_1 = user_id_1.toString();
		user_id_2 = user_id_2.toString();
		let q = { $in: [user_id_1, user_id_2]};
		let result = await FriendRequest.exists({ requesting_user_id: q, requested_user_id: q, accepted: true})
		return result;
	}

	static async friendsOfFriends(user_id_1, user_id_2){
		let friends = await FriendRequest.areFriends(user_id_1, user_id_2)
		if(friends) return friends;

		user_id_1 = user_id_1.toString();
		user_id_2 = user_id_2.toString();

		let friends_of_1 = await FriendRequest.friendIds(user_id_1);
		if(friends_of_1.length === 0) return false;
		let friends_of_2 = await FriendRequest.friendIds(user_id_2);
		if(friends_of_2.length === 0) return false;

		return friends_of_1.some(id => friends_of_2.includes(id));
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