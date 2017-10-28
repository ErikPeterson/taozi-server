'use strict';

const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const DATABASE_URL = (()=>{
    if(process.env.DATABASE_URL) return process.env.DATABASE_URL;
    let env = process.env.NODE_ENV || 'development';
    let config = require('../database.json');
    return config[env];
})();

const DuplicatePropertyError = require('./errors/duplicate_property_error');

class DB {
    static connection(){
        this._connection = this._connection || MongoClient.connect(DATABASE_URL);
        return Promise.resolve(this._connection);
    }

    static update(collection_name, _id, attributes) {
        return DB.connection().then((db) => {
            let collection = db.collection(collection_name);

            return collection.updateOne({_id: _id}, {$set: attributes});
        });
    }

    static save(collection_name, attributes){
        return DB.connection().then((db) => {
            let collection = db.collection(collection_name);

            if(Array.isArray(attributes)) {
                return collection.insertMany(attributes);
            } else {
                return collection.insert(attributes);
            }
        }).catch((e) => {
            if(e.code === 11000) throw new DuplicatePropertyError(e);
            throw e;
        });
    }

    static find(collection_name, _id){
        _id = new Mongo.ObjectID(_id);
        return DB.connection().then((db) => {
            let collection = db.collection(collection_name);
            return collection.findOne({_id: _id});
        });
    }

    static where(collection_name, query, options = {}){
        return DB.connection().then((db) => {
            let result = db.collection(collection_name).find(query);
            if(options.sort) result = result.sort(options.sort);
            if(options.limit) result = result.limit(options.limit);
            if(options.page && options.limit) result = result.skip((options.page - 1) * options.limit);
            return result;
        }).then((cursor) => {
            let docs = cursor.toArray();
            let count = cursor.count();
            return Promise.all([docs, count]);
        }).then((results) => {
            results[0].next_page = options.limit && results[1] > options.limit;
            return results[0];
        });
    }

    static exists(collection_name, query){
        return DB.connection().then((db) => {
            return db.collection(collection_name).count(query, {limit: 1})
        }).then((count) => {
            return count > 0;
        });
    }

    static delete(collection_name, _id){
        return DB.connection().then((db) => {
            return db.collection(collection_name).deleteOne({_id: _id});
        });
    }
}

module.exports = DB;
