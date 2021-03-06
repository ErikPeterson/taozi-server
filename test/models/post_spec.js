'use strict';

const expect = require('expect.js');
const Post = require('../../models/post');
const DB = require('../support/db_cleaner');

describe('Post', () => {
	
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	let post;

	beforeEach(()=>{
		post = new Post({user_id: '1234', body: [{type: 'text', content: ''}]})
	});

	describe('validations', () => {

		describe('user_id', () => {
			it('must be present', async () => {
				post._unset('user_id');
				try{
					await post.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/user_id/);
				}
			});
		});

		describe('created_at', () => {
			it('is set on save', async () => {
				await post.save();
				expect(post.get('created_at')).to.be.ok();
			});
		})

		describe('body', () => {
			it('must be an array', async () => {
				post.set('body', 1);
				try{
					await post.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.message).to.match(/body/);
				}
			});

			describe('modules', () => {
				it('must have a type member', async () => {
					post.set('body', post.get('body').concat({}));
					try{
						await post.save();
						expect().fail();
					} catch(e) {
						expect(e.constructor.name).to.be('RecordInvalid');
						expect(e.message).to.match(/body/);
					}
				});
			});
		});
	});

	describe('async #addComment(comment_params)', () => {
		it('adds a comment to the post', async () => {
			await post.save();
			await post.addComment({user_id: '1', text: 'Hey'});
			expect(post.get('comments').length).to.be(1);
		});

		it('throws an error if the comment is invalid', async () => {
			await post.save();
			try{
				await post.addComment({users_id: '1', butt: 'hey', whatever: 'dickhead'});
				expect().fail();
			} catch(e) {
				expect(e.constructor.name).to.be('RecordInvalid');
			}
		});
	});

	describe('async #incrementLikeCount', () => {
		it('increments the like_count property of the post and saves', async () => {
			await post.save();
			await post.incrementLikeCount();

			expect(post.get('like_count')).to.be(1);
			expect(post.changed).to.not.be.ok();
		});

		it('does not save if the post is not yet persisted', async () => {
			await post.incrementLikeCount();
			expect(post.new_record).to.be.ok();
		});

	});
});