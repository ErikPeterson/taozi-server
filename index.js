'use strict';

const Koa = require('koa');
const app = new Koa();

const logger = require('./lib/logger')();

app.use(logger.middleware);

app.use(async (ctx, next)=> {
    try {
        await next();
    } catch(e) {
        logger.error('', e);
        ctx.status = e.status || 500;
        ctx.body = e.message;
        ctx.app.emit('error', e, ctx);
    }
});

const router = require('./routes/router.js');
app.use(router.routes());

app.listen(process.env.port || 3000);