'use strict';

module.exports = (logger) => {
	return async (ctx, next) => {
	    try {
	        await next();
	    } catch(e) {
	        logger.error('', e);
	        ctx.status = e.status || 500;

	        if(e.toJSON){
	        	ctx.body = {errors: [e.toJSON()]}
	        } else {
	        	ctx.body = {errors: [{type: 'Error', messages: [e.message]}]}
	        }

	    }
	};
};
