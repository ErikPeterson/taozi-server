'use strict';
const Auth = require('../models/auth');
const Unauthorized = require('./errors/unauthorized');

const tokenReg = /^Bearer (\S+)$/;
const parseToken = (header='') => {
	let match = header.match(tokenReg);
	return match ? match[1] : null;
};

const throwUnauth = (ctx) => {
	let message = `${ctx.request.method} ${ctx.request.path} requires authentication`;
	throw new Unauthorized(message);
};

module.exports = async (ctx, next) => {
	let token = parseToken(ctx.request.headers.authorization);
	if(token){
		let auth = (await Auth.where({token: token}, {limit: 1}))[0];
		if(auth){
			ctx.current_user_id = auth.get('user_id').toString();
			ctx.auth = auth;
		} else{
			throwUnauth(ctx);
		}
	} else{
		throwUnauth(ctx);
	}

	await next();
};
