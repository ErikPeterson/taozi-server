'use strict';

const DB = require('../support/db_cleaner');
const expect = require('expect.js');
const Comment = require('../../models/comment');

describe('Comment', () => {
	before(async () => { await DB.clean() });
	afterEach(async () => { await DB.clean() });

	describe('validations', () => {
		let comment;

		beforeEach(() => {
			comment = new Comment({user_id: '1234', text: "what a country!", post_id:'12345'});
		});

		describe('user_id', () => {
			it('must be present', async () => {
				comment._unset('user_id');
				try{
					await comment.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/user_id/);
				}
			});
		});

		describe('text', () => {
			it('must be present', async () => {
				comment._unset('text');
				try{
					await comment.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/text/);
				}

			});
		});

		describe('post_id', () => {
			it('must be present', async () => {
				comment._unset('post_id');
				try{
					await comment.save();
					expect().fail();
				} catch(e) {
					expect(e.constructor.name).to.be('RecordInvalid');
					expect(e.full_messages[0]).to.match(/post_id/);
				}

			});
		});

		describe('created_at', () => {
			it('is set on create', async () => {
				await comment.save();
				expect(comment.get('created_at')).to.be.ok();
			});
		})
	});
});