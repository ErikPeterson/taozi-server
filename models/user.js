'use strict';

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
    '_validate_post_visibility', 
    '_validate_old_post_visibility'
];

const RENDERABLE_ATTRIBUTES = [
    'email', 
    'name', 
    '_id', 
    'avatar_url', 
    'bio', 
    'display_name',
    'post_visibility',
    'old_post_visibility',
    'blocked',
    'friends',
    'friend_requests',
    'requested_friends'
];

const RecordInvalid = require('./errors/record_invalid');

class User extends BaseModel {
    static get column_name(){ return 'users'; }
    static get before_validate(){ return BEFORE_VALIDATE; }
    static get renderable_attributes(){ return RENDERABLE_ATTRIBUTES; }
    static get renderable_attributes_for_external(){ return ['name', 'display_name', 'avatar_url', 'bio']}
    
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

    _validate_post_visibility(){
        let n = this.get('post_visibility');
        if(this.new_record && (n === undefined || n === null)) return this.set('post_visibility', 1);
        if(n !== 0 && n !== 1) this.errors.add('post_visibility', 'must be 1 or 0');
    }

    _validate_old_post_visibility(){
        let n = this.get('old_post_visibility');
        if(this.new_record && (n === undefined || n === null)) return this.set('old_post_visibility', 0);
        if(n !== 0 && n !== 1) this.errors.add('old_post_visibility', 'must be 1 or 0');
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

    async befriend(user_id){
        user_id = user_id.toString();
        let other = await User.find(user_id);

        await this.reload();

        let fr = this.get('friend_requests');

        if(!fr || !fr.map(r => r.user_id).includes(user_id)) {
            this.errors.add('user_id', 'no open friend request with this user');
            throw new RecordInvalid(this.this, this.errors);
        }

        other.set('friends', (other.get('friends') || []).concat(this.get('_id').toString()));
        this.set('friends', (this.get('friends') || []).concat(user_id));
        let new_fr = fr.reduce((a, r) => {
            if(r.user_id !== user_id) a.push(r);
            return a;
        }, [])
        
        this.set('friend_requests', new_fr);
        let rf = other.get('rf');
        let new_rf = fr.reduce((a, r) => {
            if(r.user_id !== user_id) a.push(r);
            return a;
        }, []);
        other.set('requested_friends', new_rf);

        await this.save();
        await other.save();
        return true;
    }

    async ignore(user_id){
        user_id = user_id.toString();
        let other = await User.find(user_id);

        await this.reload();

        let fr = this.get('friend_requests');

        if(!fr || !fr.map(r => r.user_id).includes(user_id)) {
            this.errors.add('user_id', 'no open friend request with this user');
            throw new RecordInvalid(this.this, this.errors);
        }

        let new_fr = fr.reduce((a, r) => {
            if(r.user_id !== user_id) a.push(r);
            return a;
        }, [])
        
        this.set('friend_requests', new_fr);
        let rf = other.get('rf');
        let new_rf = fr.reduce((a, r) => {
            if(r.user_id !== user_id) a.push(r);
            return a;
        }, []);
        other.set('requested_friends', new_rf);

        await this.save();
        await other.save();
        return true;
    }

    async requestFriendship(user_id){
        user_id = user_id.toString();
        let other = await User.find(user_id);

        if((this.get('friends') || []).includes(user_id)){
            this.errors.add('user_id', 'is already friends with this user');
            throw new RecordInvalid(this, this.errors);
        }

        if(this.friendRequested(user_id)){
            this.errors.add('user_id', 'already has an open friend request with this user');
            throw new RecordInvalid(this, this.errors);
        }

        let date = new Date();

        this.set('friend_requests', (this.get('friend_requests') || []).concat({ user_id: user_id, date: date }));
        other.set('requested_friends', (other.get('requested_friends') || []).concat({ user_id: this.get('_id').toString(), date: date }));
        await this.save();
        await other.save();
        return true;
    }

    friendRequested(user_id){
        let fr = this.get('friend_requests') || [];
        let rf = this.get('requested_friends') || [];
        return rf.concat(fr).map(r => r.user_id).includes(user_id.toString());
    }

    async visibleTo(user_id){
        user_id = user_id.toString();
        let friends = this.get('friends');
        
        if(friends){
            if(friends.includes(user_id)) return true;
            if(this.get('post_visibility') === 0 ) return false;

            let fof = await User.exists({friends: {$all: [this.get('_id').toString(), user_id]}});
            return fof;
        } 

        return false;
    }

    static get schema(){
        return {
            name: '',
            email: '',
            password_hash: '',
            avatar_url: '',
            bio: '',
            display_name: '',
            old_post_visibility: 0,
            post_visibility: 0,
            blocked: [],
            friends: [],
            friend_requests: [],
            requested_friends: []
        };
    }
}

module.exports = User;