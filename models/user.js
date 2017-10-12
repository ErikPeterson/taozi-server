'use strict';

/*
{
    name
    password_hash
    email
}
*/

const bcrypt = require('bcrypt');
const Errors = require('../lib/errors');
const DB = require('../lib/db');

const CREATABLE_ATTRIBUTES = ['name', 'password_hash', 'email'];
const UPDATABLE_ATTRIBUTES = CREATABLE_ATTRIBUTES;
const RENDERABLE_ATTRIBUTES = ['name', 'email', 'id'];
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

class User {

  constructor(attributes){
    this._attributes = attributes;
    this.errors = new Errors();
  }

  async setPasswordHash(){
    this._attributes.password_hash = await bcrypt.hash(this._attributes.password, 10);
  }

  render(){
    return RENDERABLE_ATTRIBUTES.reduce((obj, attr) => { obj[attr] = this._attributes[attr]; return obj;}, {})
  }

  validatePassword(){
    if(this._attributes.password.length < 8) this.errors.add("password", "must be at least 8 characters");
    let reg = new RegExp(`#{this._attributes.name}|#{this._attributes.email}`);
    if(reg.test(this._attributes.password)) this.errors.add("password", "may not contain your name or email");
  }

  validateName(){
    if(/^\s+$/.test(this._attributes.name)) this.errors.add("name", "may not be empty");
    if(this._attributes.name.length > 32) this.errors.add("name", "must 32 characters or fewer");
  }

  validateEmail(){
    if(/^\s+$/.test(this._attributes.email)) this.errors.add("email", "may not be empty");
    if(!EMAIL_REGEX.test(this._attributes.email)) this.errors.add("email", "must be a valid email address");
  }

  validate(){
    this.validatePassword();
    this.validateName();
    this.validateEmail();
    return this.errors.empty();
  }

  persisted(){
    return this._persisted;
  }

  _attributes_for_save(){
    return CREATABLE_ATTRIBUTES.reduce((obj, attr) => { obj[attr] = this._attributes[attr]; return obj;}, {})
  }

  async save(){
    if(this.validate()){
        await DB.save('users', this._attributes_for_save());
        this._persisted = true;
    } else {
        this._persisted = false;
    }
  }

  static async create(attributes){
    let user = new User(attributes);
    await user.setPasswordHash();
    await user.save();
    return user;
  }
}

module.exports = User;