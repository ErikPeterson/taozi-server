'use strict';

/*
{
        name
        password_hash
        email
}
*/

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const NAME_REGEX = /[^0-9aA-zZ_]/
const BaseModel = require('./base');
const hashPassword = require('../lib/hash_password');
const comparePassword = require('../lib/compare_password');

const BEFORE_VALIDATE = [
    '_validate_email',
    '_validate_name', 
    '_transform_password', 
    '_validate_password_hash', 
    '_validate_bio', 
    '_validate_display_name', 
    '_validate_posts_viewable_by', 
    '_validate_old_posts_viewable_by'
];

const RENDERABLE_ATTRIBUTES = [
    'email', 
    'name', 
    '_id', 
    'avatar_url', 
    'bio', 
    'display_name'
];

const FriendRequest = require('./friend_request');

class User extends BaseModel {
    static get column_name(){ return 'users'; }
    static get before_validate(){ return BEFORE_VALIDATE; }
    static get renderable_attributes(){ return RENDERABLE_ATTRIBUTES; }
    
    _validate_email(){
        if( (this.new_record || this._changes.email) && !EMAIL_REGEX.test(this.get('email'))) this.errors.add('email', 'must be a valid email address');
    };

    _validate_name(){
        let name = this.get('name');

        if(!name) return this.errors.add('name', 'must be present');
        if(name.length >= 23) this.errors.add('name', 'must be 22 characters or fewer');
        if(NAME_REGEX.test(name)) this.errors.add('name', 'may contain only alphanumeric characters and _')
    }

    _validate_display_name(){
        if(!this.get('display_name')) this.set('display_name', this.get('name'));
        if(!this.get('display_name')) return this.errors.add('display_name', 'must be at least 1 character');
        if(this.get('display_name').length > 200) this.errors.add('display_name', 'must be 200 characters or fewer');
    }

    _validate_password_hash(){
        if(!this.get('password_hash')) this.errors.add('password_hash', 'must be present');
    }

    _validate_bio(){
        if(this.get('bio') && this.get('bio').length > 200) this.errors.add('bio', 'must be 200 characters or fewer');
    }

    _validate_posts_viewable_by(){
        let n = this.get('posts_viewable_by');
        if(this.new_record && (n === undefined || n === null)) return this.set('posts_viewable_by', 1);
        if(n !== 0 && n !== 1) this.errors.add('posts_viewable_by', 'must be 1 or 0');
    }

    _validate_old_posts_viewable_by(){
        let n = this.get('old_posts_viewable_by');
        if(this.new_record && (n === undefined || n === null)) return this.set('old_posts_viewable_by', 0);
        if(n !== 0 && n !== 1) this.errors.add('old_posts_viewable_by', 'must be 1 or 0');
    }

    async _transform_password(){
        let password = this.get('password');
        this._unset('password');

        if(this.new_record && !password) return this.errors.add('password', 'must be present for new users');
        if(password){
                if(password.length < 6) return this.errors.add('password', 'must be at least 6 characters');
                let hash = await hashPassword(password);
                this.set('password_hash', hash);
        }

    }

    async authenticate(password=''){
        if(!this.persisted) return false;
        return comparePassword(password, this.get('password_hash'));
    }

    async visibleTo(user_id){
        if(this.get('posts_viewable_by') === 0){
            let friends = await FriendRequest.friends(this.get('_id'), user_id);
            return friends;
        } else {
            let fof = await FriendRequest.friendsOfFriends(this.get('_id'), user_id);
            return fof;
        }
    }

    static get schema(){
        return {
            name: '',
            email: '',
            password_hash: '',
            avatar_url: '',
            bio: '',
            display_name: '',
            old_posts_viewable_by: 0,
            posts_viewable_by: 0
        };
    }
}

module.exports = User;