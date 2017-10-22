'use strict';

const expect = require('expect.js');
const DB = require('../support/db_cleaner.js');

const FriendRequest = require('../../models/friend_request');

describe('FriendRequest', () => {
	before(async () => { await DB.clean() });
	afterEach(async () => { await DB.clean() });

	describe('validations', () => {
		describe('requesting_user_id', () => {
			it('must be present', async () => {
				try{
					await FriendRequest.create({requested_user_id: '1234'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/requesting_user_id/);
				}
			});
		});

		describe('requested_user_id', () => {
			it('must be present', async () => {
				try{
					await FriendRequest.create({requesting_user_id: '1234'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/requested_user_id/);
				}

			});

			it('must be unique within the scope of the requesting_user_id', async () => {
				await FriendRequest.create({requesting_user_id: '1234', requested_user_id: '12345'});
				try{
					await FriendRequest.create({requesting_user_id: '1234', requested_user_id: '12345'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/must be unique within the scope of `requesting_user_id'/);
				}
			});
		});

		describe('accepted', () => {
			it('cannot be changed once set', async () => {
				let friend_request = await FriendRequest.create({requesting_user_id: '1234', requested_user_id: '2345', accepted: true});
				try{
					await friend_request.update({accepted: false})
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/cannot be changed once set/);
				}
			});

			it('can only be set to true', async () => {
				try{
					await FriendRequest.create({requesting_user_id: '1234', requested_user_id: '2345', accepted: false});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/must be true or null/);
				}
			});
		})
	});

});