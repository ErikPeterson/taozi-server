'use strict';

const DB = require('../../lib/db');

const deleteCollections = (db, collections) => {
	return collections.map((collection) => {
		return collection.remove({});
	})
};

const clean = (db) => {
	return db.collections()
		.then((collections) => {
			return Promise.all(deleteCollections(db, collections));
		});
};

DB.clean = () => {
	return DB.connection().then(clean);
};

module.exports = DB;