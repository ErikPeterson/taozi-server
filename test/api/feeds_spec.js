'use strict';

const expect = require('expect.js');
const API = require('../support/api');
const DB = require('../support/db_cleaner');

const User = require('../../models/user');
const Auth = require('../../models/auth');
const Post = require('../../models/post');

const setUpFeed = async (post_count, friends) => {
    let author = await User.create({email: 'a@b.com', name: 'a', password: '123456'});
    let user = await User.create({email: 'b@a.com', name: 'b', password: '123456'});
    let auth = await Auth.createByCredentials({email: 'b@a.com', password: '123456'});
    
    if(friends){
        await author.update({friends: [user.get('_id').toString()]});
        await user.update({friends: [author.get('_id').toString()]});
    }
    
    let posts = [];
    let id = author.get('_id').toString();
    for(let i = 0; i < post_count; i++){
        let post = await Post.create({user_id: id, body: [{type: 'text', content: ''}]});
        posts.push(post);
    }

    return [author, user, {Authorization: `Bearer ${auth.get('token')}`}, posts];
};

describe('/feeds', () => {
    before(async () => { await DB.clean() }); 
    afterEach(async () => { await DB.clean() });

    describe('AUTHENTICATED GET /feeds/:user_id', () => {
        describe('with an authenticated user', () => {
            describe('when the authenticated user is friends with the feed author', () => {
                it('returns the most recent page of posts from the feed', async () => {
                    let [author, user, auth_header, posts] = await setUpFeed(6, true);
                    let resp = await API.get(`/feeds/${author.get('name')}`,
			            null, auth_header);
                    expect(resp.statusCode).to.be(200);
                    expect(resp.body.feed.posts.map( p => p._id).indexOf(posts[0].get('_id').toString())).to.be(-1); 
                    expect(resp.body.feed.meta.next_page).to.be(2);
                    expect(resp.body.feed.meta.prev_page).to.be(null);
                });

                describe('with ?include=user', () => {
                    it('includes a user representation in the response', async () => {
                        let [author, user, auth_header, posts] = await setUpFeed(6, true);
                        let resp = await API.get(`/feeds/${author.get('name')}?include=user`,
                            null, auth_header);
                        expect(resp.statusCode).to.be(200);
                        expect(resp.body.feed.posts.map( p => p._id).indexOf(posts[0].get('_id').toString())).to.be(-1); 
                        expect(resp.body.feed.meta.next_page).to.be(2);
                        expect(resp.body.feed.meta.prev_page).to.be(null);
                        expect(resp.body.feed.user).to.be.ok();
                    });
                });

                describe('with a page parameter', () => {

                    it('returns the indicated page of posts from the feed', async () => {
                        let [author, user, auth_header, posts] = await setUpFeed(6, true);
                        let resp = await API.get(`/feeds/${author.get('name')}?page=2`,
			                null, auth_header);
                        expect(resp.statusCode).to.be(200);
                        expect(resp.body.feed.posts.length).to.eql(1);
                        expect(resp.body.feed.posts[0]._id).to.eql(posts[0].get('_id').toString());
                        expect(resp.body.feed.meta.prev_page).to.be(1);
                        expect(resp.body.feed.meta.next_page).to.be(null);
                    });

                    describe('with a non existent page', () => {
                        it('returns a 404', async () => {
                            let [author, user, auth_header, posts] = await setUpFeed(0, true); 
                            let resp = await API.get(`/feeds/${author.get('name')}?page=2`,
			                    null, auth_header);
                            expect(resp.statusCode).to.eql(404);
                        });
                    });
                });
            });

            describe('when the authenticated user is not friends with the feed author', () => {
                it('responds with a 403', async () => {
                    let [author, user, auth_header] = await setUpFeed(0, false);
                    let resp = await API.get(`/feeds/${author.get('name')}`, null, auth_header);

                    expect(resp.statusCode).to.be(403);
                });
            });
        }); 
    });    
});
