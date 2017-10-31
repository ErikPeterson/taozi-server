'use strict';

const _ = require('lodash');
const Forbidden = require('../lib/errors/forbidden');
const RecordNotFound = require('../models/errors/record_not_found');
const Router = require('koa-router');

const Post = require('../models/post');
const User = require('../models/user');

const feeds = new Router();

const bodyParser = require('koa-body')({form: false, text: false, url_encoded: false});
const permittedParams = require('../lib/permitted_params');
const authenticateUser = require('../lib/authenticate_user');

const authorizeUserByUserName = require('../lib/authorize_user_by_user_name');

const loadFeed = async (ctx, next) => {
    let page = +ctx.query.page || 1;
    let query = {user_id: ctx.author.get('_id').toString()};
    
    if(ctx.query.after){
        let date = new Date(ctx.query.after);
        query.created_at = { $gte: date };
    }

    let posts = await Post.where(query, {limit: 5, page: page, sort: ['_id', -1]});
    if(posts.length === 0 && page !== 1) throw new RecordNotFound('Post', {user_id: ctx.author.get('_id'), page: page});
    let meta = { page: page };
    meta.next_page = posts.next_page ? page + 1 : null;
    meta.prev_page = page === 1 ? null : page - 1;
    meta.after = ctx.query.after || null;
    
    ctx.status = 200;
    ctx.body = {feed: { meta: meta, posts: posts.map( p => p.render() ) }};
    
    if(ctx.query.include === 'user'){
        ctx.body.feed.user = ctx.author.render('external');
    }
};

module.exports = (router, logger) => {
    feeds.get('user_own_feed', '/me', 
        authenticateUser,
        async (ctx, next) => {
            let author = await User.find(ctx.current_user_id);
            ctx.author = author;
            await next();
        },
        loadFeed
    );
    
    feeds.get('user_feed', '/:user_name', 
        authenticateUser,
        async (ctx, next) => {
            let author = (await User.where({name: ctx.params.user_name}))[0];
            if(!author) throw new RecordNotFound('User', {name: ctx.params.user_name});
            let visible = await author.visibleTo(ctx.current_user_id);
            if(!visible) throw new Forbidden('you do not have permission to access this resource');
            ctx.author = author;
            await next();
        },
        bodyParser,
        loadFeed
    );
    router.use('/feeds', feeds.routes(), feeds.allowedMethods());
};
