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

	describe('validations', () => {
		let post;

		beforeEach(()=>{
			post = new Post({user_id: '1234', body: [{type: 'text', content: ''}]})
		});

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
});