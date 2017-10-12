'use strict';

const Errors = require('../lib/errors');
const DB = require('../lib/db');

const ModelBase {

    constructor(attributes){
        this._attributes = attributes;
        this._id = attributes._id;
        this.errors = new Errors();
    }

    render(){
        return this.constructor.renderableAttributes
    }

    validate(){
        this.constructor.validations.each((m)=>{this[m].call(this)})
        return this.errors.empty();
    }

    get persisted(){
        return this._id ? !this._changed : false;
    }

    static get validations(){
        return [];
    }

    static get renderableAttributes(){
        return [];
    }

    static async save(){
        if(this.validate()){
            let result = await DB.save(this.constructor.column_name, this._attributes_for_save);
            
        }
    }

    static async create(attributes){

    }

}