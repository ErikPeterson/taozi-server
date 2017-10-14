'use strict';

const expect = require('expect.js');
const DB = require('../support/db_cleaner.js');

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
    });

    describe('.update(collection_name, _id, attributes)', ()=>{

    	it('can update a single record', async () => {
    		let _id = (await DB.save('test_records', {a: 'b'})).insertedIds[0];
    		let result = await DB.update('test_records', _id, {a: 'c', b: 1});
    		expect(result.result.ok).to.be(1);
    		expect(result.modifiedCount).to.be(1);
    	});

    });
});
