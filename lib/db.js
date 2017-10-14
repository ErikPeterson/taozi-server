'use strict';

const MongoClient = require('mongodb').MongoClient;
const DATABASE_URL = process.env['DATABASE_URL'] || require('./config')('DATABASE_URL');

class DB {
    static connection(){
        return MongoClient.connect(DATABASE_URL)
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
        });
    }
}

module.exports = DB;