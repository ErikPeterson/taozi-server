'use strict';

const Errors = require('../lib/errors');
const DB = require('../lib/db');
const _ = require('lodash');
const RecordInvalid = require('./errors/record_invalid');
const RecordNotFound = require('./errors/record_not_found');

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
    for(let key in schema){
        if(attrs.hasOwnProperty(key)) {
            let expected = Array.isArray(schema[key]) ? 'array' : typeof schema[key];
            let actual = Array.isArray(attrs[key]) ? 'array' : typeof attrs[key];
            let error_key = parent_key ? `${parent_key}.${key}` : key;

            if(expected === actual) {
                if(actual === 'object'){
                    let expected_keys = Object.getOwnPropertyNames(schema[key]);
                    if(expected_keys.length > 0){
                        Object.getOwnPropertyNames(attrs[key]).forEach((k) => { 
                            if(expected_keys.indexOf(k) === -1){
                                let inner_error_key = `${error_key}.${k}`;
                                errors.add(inner_error_key, `is not a permitted key`);
                            }
                        }); 
                    }
                    compare(schema[key], attrs[key], error_key, errors);
                }
            } else {
                errors.add(error_key, `must be a \`${expected}'`);
            }
        }
    }
};

const validateInstance = (schema, instance) => {
    let attrs = instance.new_record ? _.merge({}, instance._attributes, instance._changes) : instance._changes;
    return compare(schema, attrs, undefined, instance.errors);
};

class ModelBase {

    constructor(attributes = {}){
        this._attributes = attributes;
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
                if(memo2[k] === memo1[k] === undefined) return undefined;
                if(i === len - 1) return memo2[k] || memo1[k];
                memo1 = memo1[k] || {};
                memo2 = memo2[k] || {};
                i++;
            }
        }
    }

    save(){
        if(!this.valid) throw new RecordInvalid(this, this.errors);
        let was_new = this.new_record;
        if(was_new) this.runHook('before_create');
        this.runHook('before_save');
        
        if(was_new) {
            return DB.save(this.constructor.column_name, _.merge({}, this._attributes, this._changes)).then((result)=>{
                this._attributes = _.merge(this._attributes, result.ops[0]);
                this._changes = {};
                this.runHook('after_save');
                if(was_new) this.runHook('after_create');
                return true;
            });
        }
        this.runHook('before_update');
        return DB.update(this.constructor.column_name, this._id, this._changes).then((result)=> {
            if(result.modifiedCount === 0) throw new RecordNotFound({_id: this._id});
            this._attributes = _.merge(this._attributes, this._changes);
            this._changes = {};
            this.runHook('after_save');
            this.runHook('after_update');
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

    validate(){
        this.errors.clear();
        this.runHook('before_validate');
        validateInstance(this.constructor.schema, this);
        this.runHook('after_validate');
        return this.errors;
    }

    runHook(hook){
        let fns = this.constructor[hook];
        fns.forEach((fn) => this[fn]());
    }

    get valid(){
        this.validate();
        return this.errors.empty;
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