'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.addIndex('friend_requests', 'friend_requests.requested_user_id', ['groupNumber', 'requested_user_id', 'requesting_user_id'], true);
};

exports.down = function(db) {
  return db.removeIndex('friend_requests', 'friend_requests.requested_user_id');
};

exports._meta = {
  "version": 1
};
