'use strict';

const expect = require('expect.js');
const DB = require('../support/db_cleaner');
const User = require('../../models/user');

describe('User', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('validations', () => {
		describe('email', () => {
			it('must be unique', async () => {
				let props = {email: 'b@a.com', name: 'aname', password: 'whatever'};

				await User.create(props);

				try {
					props.name = 'name';
					await User.create(props);
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/email is not valid/);
				}

			});

			it('must be a valid email', async () => {
				try {
					await User.create({email: 'b', name: 'aname', password: '123456'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/email is not valid/);
				}
			});
		});

		describe('name', () => {
			it('must be present', async () => {
				try{
					await User.create({email: 'a@b.com', password: '123456'});
					expect().error();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name/)
				}

				let user = await User.create({email: 'a@b.com', password: '123456', name: 'hey'});
				user.set('name', undefined);
				try {
					await user.save()
					expect().error()
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name/)
				}
			});

			it('must be unique', async () => {
				let props = {email: 'b@a.com', name: 'aname', password: 'whatever'};
				await User.create(props);
				try {
					props.email = 'a@b.com';
					await User.create(props);
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/name is not valid/);
				}
			});

			it('must be fewer than 23 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'xxxxxxxxxxxxxxxxxxxxxxx', password: '123456'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/22 characters or fewer/)
				}
			});

			it('must not contain any characters besides alphanumeric and _', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'xxxxxxxxxx xxxxxxxxxxx', password: '123456'});
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/may contain only alphanumeric characters and _/);
				}

			});
		});

		describe('password', () => {
			it('must be present when creating a new record', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'aname'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/password.* not valid/);
				}
			});

			it('must be at least 6 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'aname', password: '1234'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.errors.full_messages[0]).to.match(/must be at least 6 characters/);
				}
			});

			it('is transformed into password_hash, and unset after save', async () => {
				let user = await User.create({email: 'a@b.com', name: 'aname', password: '123456'});
				expect(user.get('password')).to.be(undefined);
				expect(user.get('password_hash')).to.be.ok();
			});
		});

		describe('password_hash', () => {
			it('must be present', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				user._unset('password_hash');
				try{
					await user.save();
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/password_hash/);
				}
			});
		});

		describe('bio', () => {
			it('must be 200 characters or fewer', async () => {
				try{
					await User.create({email: 'b@a.com', password: '123456', name: 'a', bio: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'});
					expect().fail();
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/200 characters or fewer/);
				}
			});
		});

		describe('display_name', () => {
			it('defaults to name', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				expect(user.get('display_name')).to.be('a');

				let user2 = new User({email: 'a@b.com', password: '123456'});

				try{
					await user2.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/display_name/);
				}
			});

			it('must be between fewer than 200 characters', async () => {
				try{
					await User.create({email: 'a@b.com', name: 'a', password: '123456', display_name: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'})
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/must be 200 characters or fewer/);
				}
			});
		});

		describe('post_visibility', () => {
			it('defaults to 1 (friends of friends)', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				expect(user.get('post_visibility')).to.be(1);
			});

			it('can only be 1 or 0', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456', post_visibility: 0});
				expect(user.get('post_visibility')).to.be(0);
				try{
					await user.update({post_visibility: 50});
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});

		describe('old_post_visibility', () => {
			it('defaults to 0', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
				expect(user.get('old_post_visibility')).to.be(0);
			});

			it('can only be 1 or 0', async () => {
				let user = await User.create({email: 'a@b.com', name: 'a', password: '123456', old_post_visibility: 1});
				expect(user.get('old_post_visibility')).to.be(1);
				try{
					await user.update({old_post_visibility: 50});
				} catch (e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});
	});

	describe('async #authenticate(password)', () => {
		describe('with the correct password', () => {
			it('returns true', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate('123456');
				expect(authentic).to.be.ok();
			});
		});

		describe('with no password', () => {
			it('returns false', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate();
				expect(authentic).to.not.be.ok();
			});
		});

		describe('with an incorrect password', () => {
			it('returns false', async () => {
				let user = await User.create({email:'a@b.com', name: 'a', password: '123456'});
				let authentic = await user.authenticate('12456');
				expect(authentic).to.not.be.ok();
			});
		});

		describe('with an unpersisted record', () => {
			it('returns false', async () => {
				let user = new User();
				let authentic = await user.authenticate('12345');
				expect(authentic).to.not.be.ok();
			});
		})
	});

	describe('#friendRequested(user_id)', () => {
		it('returns true if the user id provided is in the receiver\'s friend requests', async () => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456', friend_requests: [ { user_id: '1'}]});
			expect(user.friendRequested('1')).to.be.ok();
		});

		it('returns true if the user id provided is in the receiver\'s requested friends', async () => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456', requested_friends: [ { user_id: '1'}]});
			expect(user.friendRequested('1')).to.be.ok();
		});

		it('returns false if the user id is not in either list', async () => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
			expect(user.friendRequested('1')).to.not.be.ok();
		});
	});

	describe('async #befriend(user_id)', () => {
		it('adds the users as friends and removes any friend requests between them', async () => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
			let user2 = await User.create({name: 'b', email: 'b@a.com', password: '123456'});

			await user.requestFriendship(user2.get('_id'));
			await user.befriend(user2.get('_id'));

			await user.reload();
			await user2.reload();

			expect(user.get('friends').includes(user2.get('_id').toString())).to.be.ok();
			expect(user2.get('friends').includes(user.get('_id').toString())).to.be.ok();

			expect(user.get('friend_requests')).to.be.empty();
			expect(user2.get('requested_friends')).to.be.empty();
		});

		describe('if the users are already friends', () => {
			it('throws an error', async () => {
				let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
				let user2 = await User.create({name: 'b', email: 'b@a.com', password: '123456'});

				await user.requestFriendship(user2.get('_id'));
				await user.befriend(user2.get('_id'));

				await user.reload();
				await user2.reload();				

				try{
					await user.befriend(user2.get('_id'));
					expect().fail()
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});
	});

	describe('async #requestFriendship(user_id)', () => {
		it('adds a friend request between the two users', async () => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
			let user2 = await User.create({name: 'b', email: 'b@a.com', password: '123456'});

			await user.requestFriendship(user2.get('_id'));
			await user.reload();
			expect(user.get('friend_requests')[0].user_id).to.be(user2.get('_id').toString());
			await user2.reload();
			expect(user2.get('requested_friends')[0].user_id).to.be(user.get('_id').toString());
		});

		describe('if the users are already friends', () => {
			it('throws an error', async () => {
				let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
				let user2 = await User.create({name: 'b', email: 'b@a.com', password: '123456'});
				await user2.requestFriendship(user.get('_id'));
				await user2.befriend(user.get('_id'));
				await user2.reload();
				try{
					await user2.requestFriendship(user.get('_id'));
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});

		describe('if there is already a friend request in place', () => {
			it('throws an error', async () => {
				let user = await User.create({name: 'a', email: 'a@b.com', password: '123456'});
				let user2 = await User.create({name: 'b', email: 'b@a.com', password: '123456'});
				await user.requestFriendship(user2.get('_id'));
				await user2.reload();
				try{
					await user2.requestFriendship(user.get('_id'));
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
				}
			});
		});
	});

	describe('async #visibleTo(user_id)', () => {
		let createUsers = async (visibility, friends, fof) => {
			let user = await User.create({name: 'a', email: 'a@b.com', password: '123456', post_visibility: visibility});
			let viewer = await User.create({name: 'b', email: 'b@a.com', password: '123456'});
			if(friends){
				await  user.update({ friends: [viewer.get('_id').toString()] })
				await  viewer.update({ friends: [user.get('_id').toString()] })
			} 

			if(fof){
				let third_party = await User.create({name: 'c', email: 'c@d.com', password: '123456', friends: [user.get('_id').toString(), viewer.get('_id').toString()]});
				await user.update({ friends: (user.get('friends') || []).concat(third_party.get('_id').toString() )})
				await viewer.update({ friends: (viewer.get('friends') || []).concat(third_party.get('_id').toString() )})
			}

			return [user, viewer];
		};

		describe('if the users are friends', () => {
			it('returns true', async () => {
				let [user, viewer] = await createUsers(0, true);
				let visible = await user.visibleTo(viewer.get('_id'));
				expect(visible).to.be.ok();
			});
		});

		describe('if the users are not friends', () => {
			describe('if the users are friends of friends', () => {
				describe('if the receiver has set post visibility to friends of friends', () => {
					it('returns true', async () => {
						let [user, viewer] = await createUsers(1, false, true);
						let visible = await user.visibleTo(viewer.get('_id'));
						expect(visible).to.be.ok();
					});
				});

				describe('if the receiver has set post visibility to only friends', () => {
					it('returns false', async () =>  {
						let [user, viewer] = await createUsers(0, false, true);
						let visible = await user.visibleTo(viewer.get('_id'));
						expect(visible).to.not.be.ok();
					});
				});
			});

			describe('if the users are not friends of friends', () => {
				it('returns false', async () => {
					let [user, viewer] = await createUsers(1, false, false);
					let visible = await user.visibleTo(viewer.get('_id'));
					expect(visible).to.not.be.ok();
				});
			});
		});
	});
});