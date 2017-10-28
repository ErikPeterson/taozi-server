'use strict';

const BaseModel = require('./base');
const User = require('./user');

class Auth extends BaseModel {
	static get column_name(){ return 'auths' };
	static get read_only(){ return true };
	static get before_validate(){ return ['_validate_user_id']}
	static get before_create(){ return ['_set_created_at', '_set_token']};
	static get renderable_attributes(){ return ['token']};

	_validate_user_id(){
		if(!this.get('user_id')) this.errors.add('user_id', 'must be present');
	}

	_set_created_at(){
		this.set('created_at', new Date());
	}

	async _set_token(){
		let token;

		while(!token){
			let temp = await require('../lib/get_token')();
			let exists = await Auth.exists({token: temp});
			if(!exists) token = temp;
		}

		this.set('token', token);
	}

	static async createByCredentials(creds){
		let auth = new Auth();
		let users = await User.where({email: creds.email}, {limit: 1});
		let user = users[0];
		if(!user) await auth.save();
		let authenticated = await user.authenticate(creds.password);
		if(!authenticated) await auth.save();
		
		auth.set('user_id', user.get('_id').toString());

		await auth.save();
		return auth;
	}

	static get schema(){
		return {
			token: '',
			user_id: '',
			created_at: new Date()
		}
	}
}

module.exports = Auth;