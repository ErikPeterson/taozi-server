'use strict';

const Forbidden = require('./errors/forbidden');
const User = require('../models/user');

module.exports = async (ctx, next) => {
		let user_name = decodeURIComponent(ctx.params.user_name);
		let users = await User.where({name: user_name}, 1);
		let user = users[0];
		if(!user || user.get('_id').toString() !== ctx.current_user_id) throw new Forbidden('the authenticated user does not have permission to perform this action');
		ctx.current_user = user;
		await next();
};
