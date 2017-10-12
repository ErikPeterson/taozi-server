'use strict';

const Parameters = require('strong-params').Parameters;

module.exports = async (ctx, next) => {
        ctx.request.params = Parameters(ctx.request.body);
        await next();
};