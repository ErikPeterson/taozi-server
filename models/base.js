'use strict';

const Errors = require('../lib/errors');
const DB = require('../lib/db');
const _ = require('lodash');
const RecordInvalid = require('./errors/record_invalid');
const RecordNotFound = require('./errors/record_not_found');
const RecordIsReadOnly = require('./errors/record_is_read_only');

const processRenderableAttributes = (ras, attrs={}) => {
    return ras.reduce((obj, ra) => {
        if(typeof ra === 'string'){
            obj[ra] = attrs[ra];
            return obj;
        }

        let key = Object.getOwnPropertyNames(ra)[0];
        obj[key] = processRenderableAttributes(ra[key], attrs[key]);
        return obj;
    }, {})
};

const compare = (schema, attrs, parent_key, errors) => {
    let schema_type = Array.isArray(schema) ? 'array' : typeof schema;
    let attr_type = Array.isArray(attrs) ? 'array' : typeof attrs;
    if(schema_type !== 'object') {
        if(schema_type !== attr_type){
            errors.add(parent_key, `must be a ${schema_type}`);
        }
    } else {
        let expected_keys = Object.getOwnPropertyNames(schema);
        if(expected_keys.length > 0) {
            Object.getOwnPropertyNames(attrs).forEach((k) => {
                let inner_key = parent_key ? `${parent_key}.${k}` : k;
                if(expected_keys.indexOf(k) === -1){
                    errors.add(inner_key, 'is not a permitted key');
                } else {
                    compare(schema[k], attrs[k], inner_key, errors);
                }
            })
        }
    }
};

const validateInstance = (schema, instance) => {
    let attrs = instance.new_record ? _.merge({}, instance._attributes, instance._changes) : instance._changes;
    return compare(schema, attrs, undefined, instance.errors);
};

class ModelBase {

    constructor(attributes = {}){
        this._attributes = _.merge({}, attributes);
        this._changes = {};
        this.errors = new Errors();
    }

    render(){
        return processRenderableAttributes(this.constructor.renderable_attributes, this._attributes)
    }

    get new_record(){
        return this._attributes._id ? false : true;
    }

    get persisted(){
        return !this.new_record;
    }

    get changed(){
        return Object.getOwnPropertyNames(this._changes).length > 0;
    }

    get _id(){
        return this._attributes._id;
    }

    set(key, val){
        let keys = key.split('.');
        let len = keys.length;

        if(len === 1) {
            this._changes[key] = val;
        } else {
            let i = 0;
            keys.reduce((obj, k) => {
                if(i === len - 1){
                    obj[k] = val;
                } else if(obj[k]){
                    i++;
                    return obj[k];
                } else {
                    obj[k] = {};
                    i++;
                    return obj[k];
                }
            }, this._changes)
        }

        return this;
    }

    _unset(key){
        delete this._attributes[key];
        delete this._changes[key];
    }

    get(key){
        let keys = key.split('.');
        let len = keys.length;

        if(len === 1){
            return this._changes[key] || this._attributes[key];
        } else {
            let memo1 = this._attributes;
            let memo2 = this._changes;
            let i = 0;
            for( let k of keys) {
                if(memo2[k] === memo1[k] && memo1[k] === undefined) return undefined;
                if(i === len - 1) return memo2[k] || memo1[k];
                memo1 = memo1[k] || {};
                memo2 = memo2[k] || {};
                i++;
            }
        }
    }

    async save(){
        if(this.constructor.read_only && !this.new_record) throw new RecordIsReadOnly(this);
        await this.validate()
        if(!this.errors.empty) throw new RecordInvalid(this, this.errors);

        let was_new = this.new_record;
        if(was_new) {
            await this.runHook('before_create');
        }
        await this.runHook('before_save');
        
        if(was_new) {
            return DB.save(this.constructor.column_name, _.merge({}, this._attributes, this._changes))
                .then((result)=>{
                    this._attributes = _.merge(this._attributes, result.ops[0]);
                    this._changes = {};
                    return this.runHook('after_save');
                }).then(()=>{
                    return this.runHook('after_create');
                }).then(()=>true).catch((e) => {
                    if(e.constructor.name === 'DuplicatePropertyError'){
                        let prop = e.property.replace(/^[^.]+/,'');
                        this.errors.add(prop, 'must be unique');
                        throw new RecordInvalid(this, this.errors);
                    }

                    throw e;
                });
        }
        await this.runHook('before_update');
        return DB.update(this.constructor.column_name, this._id, this._changes).then((result) => {
            if(result.modifiedCount === 0) throw new RecordNotFound({_id: this._id});
            this._attributes = _.merge(this._attributes, this._changes);
            this._changes = {};
            return this.runHook('after_save');
        }).then(()=>{
           return this.runHook('after_update');
        }).then(()=>{
            return true;
        });
    }

    delete(){
        return DB.delete(this.constructor.column_name, this._id).then((result) => {
            if(result.deletedCount === 0) throw new RecordNotFound(this.constructor.name, {_id: this._id});
            delete this._attributes['_id'];
            return this;
        });
    }

    async validate(){
        this.errors.clear();
        await this.runHook('before_validate');
        validateInstance(this.constructor.schema, this);
        await this.runHook('after_validate');
        return this.errors;
    }

    async runHook(hook){
        let fns = this.constructor[hook];
        for(let fn of fns){
            await Promise.resolve(this[fn]());
        }
    }

    static get renderable_attributes(){
        return [];
    }

    static get schema(){
        return {};
    }

    static async create(attributes){
        let inst = new this(attributes);
        await inst.save();
        return inst;
    }

    static async find(_id){
        return DB.find(this.column_name, _id)
                .then((attrs) => {
                    if(!attrs) throw new RecordNotFound(this.name, {_id: _id});
                    return new this(attrs);
                })
    }

    static get before_validate(){ return []; }
    static get after_validate(){ return []; }
    static get before_save(){ return []; }
    static get after_save(){ return []; }
    static get before_create(){ return []; }
    static get after_create(){ return []; }
    static get before_update(){ return []; }
    static get after_update(){ return []; }
}

module.exports = ModelBase;