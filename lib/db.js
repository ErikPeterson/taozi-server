'use strict';

const MongoClient = require('mongodb').MongoClient;
const DATABASE_URL = process.env['DATABASE_URL'] || 'mongodb://localhost:27017/taozi';

class DB {
    static connection(){
        return MongoClient.connect(DATABASE_URL)
    }

    static update(column, _id, attributes) {
        return DB.connection().then((db) => {
            let collection = db.collection(column);

            return collection.updateOne({_id: _id}, {$set: attributes});
        });
    }

    static save(column, attributes){
        return DB.connection().then((db) => {
            let collection = db.collection(column);

            if(Array.isArray(attributes)) {
                return collection.insertMany(attributes);
            } else {
                return collection.insert(attributes);
            }
        });
    }
}

module.exports = DB;