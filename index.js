'use strict';

const Koa = require('koa');
const app = new Koa();

const {logger, middleware} = require('./lib/logger')();

app.use(middleware);

app.use(async (ctx, next)=> {
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
        ctx.app.emit('error', e, ctx);
    }
});

const router = require('./routes/router.js');
app.use(router.routes());

app.listen(process.env.port || 3000);

module.exports = app;