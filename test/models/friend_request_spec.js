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

	describe('async .areFriends(user_id_1, user_id_2)', () => {
		it('returns true if an accepted friend request with the two specified ids exists', async () => {
			let req = await FriendRequest.create({requesting_user_id: '1', requested_user_id: '2', accepted: true});
			let result = await FriendRequest.areFriends('1', '2');
			expect(result).to.be.ok();
		});

		it('returns false if an unaccepted friend request with the two specified ids exists', async () => {
			let req = await FriendRequest.create({requesting_user_id: '1', requested_user_id: '2'});
			let result = await FriendRequest.areFriends('1', '2');
			expect(result).to.not.be.ok();

		});

		it('returns false if no friend request with the two specified ids exists', async () => {
			let result = await FriendRequest.areFriends('1', '2');
			expect(result).to.not.be.ok();
		});
	});

	describe('async .friendIds(user_id)', () => {
		it('returns all the user ids that are friends of the user', async () => {
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '2', accepted: true })
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '3', accepted: true })
			await FriendRequest.create({ requesting_user_id: '4', requested_user_id: '1', accepted: true })
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '5'})
			let res = await FriendRequest.friendIds('1');
			expect(res.length).to.be(3);
			expect(res.includes('5')).to.not.be.ok();
		});

		it('returns an empty array if the user has no friends', async () => {
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '5'})
			let res = await FriendRequest.friendIds('1');
			expect(res.length).to.be(0);
		});
	});

	describe('async .friendsOfFriends(user_id_1, user_id_2)', () => {
		it('returns true if the users are friends', async () => {
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '2', accepted: true});
			let result = await FriendRequest.friendsOfFriends('1', '2');
			expect(result).to.be.ok();
		});

		it('returns true if the users have a friend in common', async () => {
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '3', accepted: true});
			await FriendRequest.create({ requesting_user_id: '2', requested_user_id: '3', accepted: true});
			let result = await FriendRequest.friendsOfFriends('1', '2');
			expect(result).to.be.ok();
		});

		it('returns false if the users have no friends in common', async () => {
			await FriendRequest.create({ requesting_user_id: '1', requested_user_id: '3', accepted: true});
			await FriendRequest.create({ requesting_user_id: '2', requested_user_id: '4', accepted: true});
			let result = await FriendRequest.friendsOfFriends('1', '2');
			expect(result).to.not.be.ok();
		});
	});

});