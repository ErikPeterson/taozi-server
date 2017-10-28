'use strict';

const expect = require('expect.js');
const DB = require('../support/db_cleaner.js');
const sinon = require('sinon');

describe('DB', () => {
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

    describe('.connection', () => {
        it('returns a promise that resolves to a mongo connection', async ()=>{
            let conn = await DB.connection();
            expect(conn.constructor.name).to.be('Db');
        });
    });

    describe('.save(collection_name, attributes)', () => {
    	it('saves the provided attributes to a new record in the indicated collection', async () => {
    		let result = await DB.save('test_records', {hey: 'now'});
    		expect(result.result.ok).to.be(1);
    		expect(result.result.n).to.be(1);
    		expect(result.ops[0].hey).to.be('now');
    	});

    	it('can instantiate multiple records at the same time', async () => {
    		let result = await DB.save('test_records', [{a: 'b'}, {b: 'a'}]);
    		expect(result.result.ok).to.be(1);
    		expect(result.result.n).to.be(2);
    		expect(result.ops.length).to.be(2);
    	});

        describe('when the save violates a unique index', () =>{
            beforeEach(async () => {
                await DB.save('test_records', {prop: 'a'})
                        .then(() => {
                            return DB.connection();
                        }).then((db) => {
                            return db.collection('test_records').createIndex({prop: 1}, {name: 'test_records.prop', unique: true});
                        });
            });

            afterEach(async () => {
                return DB.connection().then((db) => {
                    return db.collection('test_records').dropIndexes();
                });
            });

            it('raises a DuplicatePropertyError', async () => {
                try{
                    await DB.save('test_records', {prop: 'a'});
                    expect().fail();
                } catch (e) {
                    expect(e.constructor.name).to.be('DuplicatePropertyError');
                    expect(e.property).to.be('test_records.prop');
                    expect(e.message).to.match(/test_records.prop must be unique/)
                }
            });
        });

        describe('when the save operation raises any other error', () => {
            it('reraises the error', async () => {
                let fn =  async () => {
                    throw new Error('my error');
                };

                let stub = sinon.stub(DB, 'connection').callsFake(fn);

                try{
                    await DB.save('test_records', {prop: 'a'});
                    expect().fail();
                } catch (e) {
                    expect(e.message).to.be('my error');
                }

                stub.restore();
            });
        });
    });

    describe('.delete(collection_name, _id)', () => {
        it('deletes a single record', async () => {
            let result = await DB.save('test_records', {});
            await DB.delete('test_records', result._id);
            let newResult = await DB.find('test_records', result._id);
            expect(newResult).to.be(null);
        });
    });

    describe('.update(collection_name, _id, attributes)', () => { 

    	it('can update a single record', async () => {
    		let _id = (await DB.save('test_records', {a: 'b'})).insertedIds[0];
    		let result = await DB.update('test_records', _id, {a: 'c', b: 1});
    		expect(result.result.ok).to.be(1);
    		expect(result.modifiedCount).to.be(1);
    	});

    });

    describe('.find(collection_name, _id)', () => {
        describe('if record exists', () => {
            it('finds and returns a hash of attributes', async () => {
                let _id = (await DB.save('test_records', {a: 'b'})).insertedIds[0];
                let result = await DB.find('test_records', _id);
                expect(result.a).to.be('b');
            });
        });
    });

    describe('.where(collection_name, query, options={limit, page, sort})', () => {
        it('returns all matching records', async () => {
            await DB.save('test_records', [{name: 'a'}, {name: 'a'}]);
            let res = await DB.where('test_records', {name: 'a'});
            expect(res.length).to.be(2);
        });

        describe('with a limit', () => {
            it('returns only a single matching record', async () => {
                await DB.save('test_records', [{name: 'a'}, {name: 'a'}]);
                let res = await DB.where('test_records', {name: 'a'}, {limit: 1});
                expect(res.length).to.be(1);
            });
        });

        describe('with a page', () => {
            beforeEach(async () => {
                await DB.save('test_records', [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'}, {name: 'e'}, {name: 'f'}]);    
            });
    
            describe('with a limit', () => {
                it('returns the indicated page of results', async () => {
                    let results = await DB.where('test_records', {}, { limit: 5, page: 1});
                    expect(results.length).to.be(5);
                    expect(results.map(r => r.name)).to.eql(['a','b','c','d','e']);
                    expect(results.next_page).to.be.ok();
                });

                describe('when there isn\'t a next page', async () => {
                    it('returns the indicated page and sets result.next_page to true', async () => {
                        let results = await DB.where('test_records', {}, { limit: 5, page: 2});
                        expect(results.length).to.be(1);
                        expect(results[0].name).to.be('f');
                    });        
                });
                describe('with then page is out of range', async () => {
                    it('returns an empty array and sets result.next_page to false', async () => {
                        let results = await DB.where('test_records', {}, { limit: 5, page: 3});
                        expect(results).to.be.empty();
                    });
                });
            });

            describe('with no limit', () => {
                it('returns the full set of results', async () => {
                    let results = await DB.where('test_records', {}, { page: 1 }); 
                    expect(results.length).to.be(6);
                });        
            });
        })
    });

    describe('.exists(collection_name, query)', () => {
        describe('if a record matching query exists', () => {
            it('returns true', async () => {
                await DB.save('test_records', {a: 'b'});
                let result = await DB.exists('test_records', {a: 'b'});
                expect(result).to.be.ok();
            })
        })
    });

});
