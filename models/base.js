'use strict';

const Errors = require('../lib/errors');
const DB = require('../lib/db');
const _ = require('lodash');

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
        if(this.new_record) {
            return DB.save(this.constructor.column_name, _.merge({}, this._attributes, this._changes)).then((result)=>{
                this._attributes = _.merge(this._attributes, result.ops[0]);
                this._changes = {};
                return true;
            });
        }

        return DB.update(this.constructor.column_name, this._id, this._changes).then(()=> {
            this._attributes = _.merge(this._attributes, this._changes);
            this._changes = {};
            return true;
        });
    }

    validate(){
        this.errors.clear();
        validateInstance(this.constructor.schema, this);
        return this.errors;
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

}

module.exports = ModelBase;