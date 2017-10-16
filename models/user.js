'use strict';

/*
{
    name
    password_hash
    email
}
*/

const bcrypt = require('bcrypt');
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const BaseModel = require('./base');

class User extends BaseModel {
  static get column_name(){ return 'users'; }
  static get before_validate(){ return ['_validate_email', '_validate_name']; }

  _validate_email(){
    if( (this.new_record || this._changes.email) && !EMAIL_REGEX.test(this.get('email'))) this.errors.add('email', 'must be a valid email address');
  };

  _validate_name(){
    if( (this.new_record || this._changes.name) && !this.get('name')) this.errors.add('name', 'must be present');
  }
  
  static get schema(){
    return {
      name: '',
      email: '',
      password_hash: ''
    };
  }
}

module.exports = User;