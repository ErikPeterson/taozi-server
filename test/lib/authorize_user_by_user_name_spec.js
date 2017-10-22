'use strict';

const expect = require('expect.js');
const authorizeUserByUserName = require('../../lib/authorize_user_by_user_name');
const User = require('../../models/user');
const DB = require('../support/db_cleaner');

describe('async authorizeUserByUserName(ctx, next)', () => {
	before(async () => await DB.clean() );
	afterEach(async () => await DB.clean() );

	let user;

	beforeEach(async () => user = await User.create({name: 'name', email: 'name@email.com', password: '123456'}));

	it('sets current user if ctx.current_user_id matches ctx.params.user_name', async () => {
		let ctx = {
			params: {
				user_name: 'name'
			},
			current_user_id: user.get('_id').toString()
		};

		let next = async ()=>{};

		await authorizeUserByUserName(ctx, next);

		expect(ctx.current_user).to.be.a(User);
	});

	it('raises a forbidden if the user doesn\'t exist', async () => {
		let ctx = {
			params: {
				user_name: 'somename'
			},
			current_user_id: user.get('_id').toString()
		};

		let next = async ()=> {};
		try{
			await authorizeUserByUserName(ctx, next);
			expect().fail();
		} catch(e) {
			expect(e.constructor.name).to.be('Forbidden');
		}
	});

	it('raises a forbidden if the user doesn\'t match', async () => {
		let ctx = {
			params: {
				user_name: 'name'
			},
			current_user_id: '1'
		};

		let next = async ()=> {};
		try{
			await authorizeUserByUserName(ctx, next);
			expect().fail();
		} catch(e) {
			expect(e.constructor.name).to.be('Forbidden');
		}
	});
});