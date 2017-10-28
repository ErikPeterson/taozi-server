'use strict';

const DB = require('../support/db_cleaner');
const BaseModel = require('../../models/base');
const FakeModel = require('../support/fake_model');
const Errors = require('../../lib/errors')
const expect = require('expect.js');
const sinon = require('sinon');

describe('ModelBase', () => {
	
	before(async () => {
		await DB.clean();
	});

	afterEach(async () => {
		await DB.clean();
	});

	describe('.column_name', () => {
		it('defaults to undefined', () => {
			expect(BaseModel.column_name).to.be(undefined);
		});

		it('must be set by the inheriting model', () => {
			expect(FakeModel.column_name).to.be('fake_models');
		});
	});

	describe('.renderable_attributes', () => {
		it('defaults to an empty array', () => {
			expect(BaseModel.renderable_attributes).to.have.length(0);
			expect(BaseModel.renderable_attributes).to.be.an(Array);
		});

		it('must be set by the inheriting model', () => {
			expect(FakeModel.renderable_attributes).to.eql(['_id', 'name', {'options': ['hey', 'now', {'what': ['yes']}]}])
		});
	});

	describe('#render()', () => {
		describe('with no attributes set', () => {
			it('returns a hash with empty values', () => {
				let inst = new FakeModel();
				expect(inst.render()).to.eql({
					'_id': undefined,
					'name': undefined,
					'options': {
						'hey': undefined,
						'now': undefined,
						'what': {
							'yes': undefined
						}
					}
				});
			});
		});

		describe('with attributes set', () => {
			it('returns a hash with values from the instance', () => {
				let attributes = {
					'_id': '1234', 
					'name': 'Mickey', 
					'options': {
						'hey': 'a', 
						'now': {
							'b': 'c'
						}, 
						'what': {
							'yes': 'no', 
							'no': 'yes'
						}
					}
				}
				let expected = {
					'_id': '1234',
					'name': 'Mickey',
					'options': {
						'hey': 'a',
						'now': {
							'b': 'c'
						},
						'what': {
							'yes': 'no'
						}
					}
				}
				let inst = new FakeModel(attributes);
				expect(inst.render()).to.eql(expected);
			});
		});
	});

	describe('#get(property_path)', () => {
		describe('when the property is not set', () => {
			it('returns undefined', () =>  {
				let inst = new FakeModel();
				expect(inst.get('name')).to.be(undefined);
				expect(inst.get('options.hey')).to.be(undefined);
			})
		});

		describe('when the property is set', () => {
			describe('and the record is persisted', () => {
				describe('and the property has not been changed since last save', () => {
					it('returns the persisted property', async () => {
						let inst = new FakeModel({name: 'butt'});
						await inst.save();
						expect(inst.get('name')).to.be('butt');
					});
				});

				describe('and the property has been changed since last save', () => {
					it('returns the new value', async () => {
						let inst = new FakeModel({name: 'butt'});
						await inst.save();
						inst.set('name', 'bum');
						expect(inst.get('name')).to.be('bum');
					});
				});
			});

			describe('and the record is not persisted', () => {
				it('returns the unpersisted propery', () => {
					let inst = new FakeModel({name: 'hello'});
					expect(inst.get('name')).to.be('hello');
				});
			});
		});
	});

	describe('#set(property_path, value)', () => {
		it('sets the indicated property to the indicated value', () => {
			let inst = new FakeModel();
			inst.set('name', 'farfignewton');
			inst.set('options.hey', 'now');
			inst.set('options.what.who', {});
			expect(inst.get('name')).to.be('farfignewton');
			expect(inst.get('options.hey')).to.be('now');
			expect(inst.get('options.what.who')).to.eql({});
		});
	});

	describe('#_unset(property)', () => {
		it('deletes the selected property from attributes and changes', () => {
			let inst = new FakeModel({name: 'blah'});
			expect(inst.get('name')).to.be('blah');
			inst._unset('name');
			expect(Object.keys(inst._attributes).indexOf('name')).to.be(-1);
			expect(Object.keys(inst._changes).indexOf('name')).to.be(-1);
		})
	});

	describe('#changed', () => {
		describe('with an unpersisted record', () => {
			it('returns false if no attributes have been set after instantiation', () => {
				let inst = new FakeModel();
				expect(inst.changed).to.be(false);
			});

			it('returns true if any attribute has been set after instantiation', () => {
				let inst = new FakeModel();
				inst.set('name', 'a name');
				expect(inst.changed).to.be(true);
			})
		});

		describe('with a persisted record', () => {
			it('returns false if no attributes have been changed since last save', async () => {
				let inst = new FakeModel({name: 'name me'});
				inst.set('options', {hey: 'now'});
				await inst.save();
				expect(inst.changed).to.be(false);
			});

			it('returns true if any attribute has been changed since last save', async () => {
				let inst = new FakeModel({name: 'name me'});
				await inst.save();
				inst.set('options', {yes: 'no'});
				expect(inst.changed).to.be(true);
			});
		});
	});

	describe('finders', () => {

		describe('.find(_id)', () => {
			describe('when the record exists', () => {
				it('returns the instance', async () => {
					let inst = await FakeModel.create({name: 'hey'});
					let inst2 = await FakeModel.find(inst.get('_id'));
					expect(inst2.render()).to.eql(inst.render());
				});
			});

			describe('when the record does not exist', () => {
				it('throws a RecordNotFound error', async () => {
					try{
						await FakeModel.find(1).then(console.log);
					} catch(e) {
						expect(e.constructor.name).to.be('RecordNotFound');
					}
				})
			});
		});

		describe('.where(query, options={})', () => {
			it('returns all matching data', async () => {
				let inst = await FakeModel.create({name: 'hey'});
				let inst2 = await FakeModel.create({name: 'hey'});

				let results = await FakeModel.where({name: 'hey'});
				expect(results.length).to.be(2);
				expect(results[0]).to.be.a(FakeModel);
			});

			describe('with a limit', () => {
				it('returns only n matching records', async () => {
					let inst = await FakeModel.create({name: 'hey'});
					let inst2 = await FakeModel.create({name: 'hey'});

					let results = await FakeModel.where({name: 'hey'}, {limit: 1});
					expect(results.length).to.be(1);
				});
			});
		});

		describe('.exists(query)', () => {
			it('returns true if any records matching the query exist', async () => {
				let inst = await FakeModel.create({name: 'name'});
				let exists = await FakeModel.exists({name: 'name'});
				expect(exists).to.be.ok();
			});

			it('returns false if no records matching the query exist', async () => {
				let exists = await FakeModel.exists({name: 'name'});
				expect(exists).to.not.be.ok();
			});
		});
	});

	describe('persistence', () => {

		describe('validations', () => {
			describe('.schema', () => {
				it('defaults to an empty hash', () => {
					expect(BaseModel.schema).to.eql({});
				});

				it('must be set on the inheriting model', () => {
					expect(FakeModel.schema).to.eql({
						name: '',
						ids: [],
						options: {
							hey: '',
							now: '',
							what: {
								yes: '',
								no: '',
								hello: {}
							}

						}
					});
				});
			});

			describe('#validate()', () => {
				describe('if the instance is not valid', () => {
					it('populates and returns errors', async () => {
						let inst = new FakeModel({name: 1, ids: 1, options: { butt: 1, what: { yes: {}, no: [], hello: {}}}})
						let errs = await inst.validate();
						expect(errs).to.be.an(Errors);
						expect(errs.empty).to.not.be.ok();
					});
				});

				describe('if the instance is valid', () => {
					it('returns the empty errors object', async () => {
						let inst = new FakeModel({name: 'hello'});
						let errs = await inst.validate();
						expect(errs).to.be.an(Errors);
						expect(errs.empty).to.be.ok();
					});
				})
			})
		});

		describe('#new_record', () => {
			it('returns true for an unpersisted record', () => {
				let inst = new FakeModel();
				expect(inst.new_record).to.be(true);
			});

			it('returns false for a persisted record', async () => {
				let inst = new FakeModel();
				await inst.save();
				expect(inst.new_record).to.be(false);
			});
		});

		describe('#persisted', () => {
			it('returns true for a persisted record', async () => {
				let inst = new FakeModel();
				await inst.save();
				expect(inst.persisted).to.be(true);
			});

			it('returns false for a new record', () => {
				let inst = new FakeModel();
				expect(inst.persisted).to.be(false);
			});

		});

		describe('#save(override_read_only=false)', () => {
			describe('with a new record', () => {
				it('saves the record to the database', async () => {
					let inst = new FakeModel({name: 'butthead'});
					await inst.save();
					expect(inst._id).to.be.ok();
				});
			});

			describe('with a persisted record', () => {
				describe('if class is read only', () => {
					beforeEach(()=>{
						FakeModel.read_only = true;
					});

					it('raises a RecordIsReadOnly', async () => {
						let inst = await FakeModel.create({name: 'wow'});
						try{
							inst.set('name', 'butt');
							await inst.save();
							expect().fail();
						} catch(e) {
							expect(e.constructor.name).to.be('RecordIsReadOnly');
						}
					});

					it('can be bypassed by passing true', async () => {
						let inst = await FakeModel.create({name: 'wow'});
						inst.set('name', 'butt');
						await inst.save(true);
						expect(inst.changed).to.be(false);
						expect(inst.get('name')).to.be('butt');
					});

					afterEach(()=>{
						FakeModel.read_only = false;
					});
				});

				it('updates the appropriate record', async () => {
					let inst = new FakeModel({name: 'wow', options: { hey: 'now'}});
					await inst.save();
					inst.set('name', 'shoot');
					inst.set('options.what.yes', 'no');
					await inst.save();
					expect(inst.changed).to.be(false);
					expect(inst.get('options.what.yes')).to.be('no');
					expect(inst.get('name')).to.be('shoot');
				});

			});

			describe('with an invalid record', () => {
				it('throws a ModelInvalid error', async () => {
					let inst = new FakeModel({name: 1});
					try{
						await inst.save();
					} catch(e) {
						expect(e.constructor.name).to.be('RecordInvalid');
						expect(inst.errors.empty).to.not.be.ok();
						expect(inst.persisted).to.not.be.ok();
					}
				});
			});

			describe('when the record violates a unique index', () => {
				beforeEach(async () => {
					await DB.connection().then((db) => {
						return db.collection('fake_models').createIndex({name: 1}, {name: 'fake_models.name', unique: true});
					});
				});

				it('raises a RecordInvalid', async () => {
					let inst = await FakeModel.create({name: 'a name'});
					try{
						await FakeModel.create({name: 'a name'});
						expect().fail();
					} catch(e) {
						expect(e.constructor.name).to.be('RecordInvalid');
						expect(e.message).to.match(/name/);
					}
				});

				afterEach(async () => {
					await DB.connection().then((db) => {
						return db.collection('fake_models').dropIndexes();
					});
				});
			});

			describe('when the save operation encounters an internal error', () =>{
				it('re raises the error', async () => {
					let fn = async () => { throw new Error('whaddap') };
					let stub = sinon.stub(DB, "connection").callsFake(fn);

					try{
						await FakeModel.create({name: 'butt'});
						expect().fail();
					} catch (e) {
						expect(e.constructor.name).to.be('Error')
						expect(e.message).to.be('whaddap');
					}

					stub.restore();
				});
			})
		});

		describe('#reload()', () => {
			describe('on a persisted record', () => {
				it('reloads the instance from the database', async () => {
					let inst = await FakeModel.create({name: 'butt'});
					let inst2 = await FakeModel.find(inst.get('_id'));
					await inst2.update({name: 'what'});
					await inst.reload();
					expect(inst.get('name')).to.be('what');
				});

				it('throws an error if the instance was deleted from the db', async () => {
					let inst = await FakeModel.create({name: 'butt'});
					let inst2 = await FakeModel.find(inst.get('_id'));
					await inst2.delete();
					
					try{
						await inst.reload();
					} catch(e) {
						expect(e.constructor.name).to.be('RecordNotFound');
					}

				});

			});

			describe('on an unpersisted record', () => {
				it('does nothing', async () => {
					let inst = new FakeModel({name: 'whatup'});
					await inst.reload();
					expect(inst.get('name')).to.be('whatup');
				});
			});
		});

		describe('#update(attrs={})', () => {
			describe('on a persisted record', () => {
				it('updates the provided attributes, then saves', async () => {
					let inst = await FakeModel.create({name: 'butt'});
					await inst.update({name: 'hello', ids: [1,2,3,4]});
					expect(inst.changed).to.not.be.ok();
					expect(inst.get('name')).to.be('hello');
					expect(inst.get('ids')).to.eql([1,2,3,4]);
				});

			});
		});

		describe('#delete()', () => {
			describe('on a persisted record', () => {
				it('deletes the record from the db and removes the _id of the instance', async () => {
					let inst = await FakeModel.create({name: 'butt'});
					let _id = inst.get('_id');
					await inst.delete();
					expect(inst.persisted).to.not.be.ok();
					expect(inst.get('_id')).to.be(undefined);
				});
			});

			describe('on an unpersisted record', () => {
				it('throws a RecordNotFound', async () => {
					let inst = new FakeModel({name: 'butt'});
					try{
						await inst.delete();
						expect.fail();
					} catch(e) {
						expect(e.constructor.name).to.be('RecordNotFound');
						expect(e.message).to.match(/could not find FakeModel with query={}/);
					}
				});
			});
		});

		describe('.create(attributes)', () => {
			it('returns a saved new record', async () => {
				let inst = await FakeModel.create({name: 'hey'});
				expect(inst.persisted).to.be.ok();
				expect(inst.get('name')).to.be('hey');
				expect(inst).to.be.a(FakeModel);
			});
		});

		describe('hooks', () => {
			it('run in the order before_validate, after_validate, before_create, before_update, before_save, after_save, after_create, after_update', async () => {
				let inst = await FakeModel.create({name: 'hey'});
				expect(inst.before_validate_called).to.be.ok();
				expect(inst.after_validate_called - inst.before_validate_called).to.be.greaterThan(0);
				expect(inst.before_create_called - inst.after_validate_called).to.be.greaterThan(0);
				expect(inst.before_save_called - inst.before_create_called).to.be.greaterThan(0);
				expect(inst.after_save_called - inst.before_save_called).to.be.greaterThan(0);
				expect(inst.after_create_called - inst.after_save_called).to.be.greaterThan(0);

				inst.set('name', 'butt');
				await inst.save();
				expect(inst.before_update_called - inst.before_create_called).to.be.greaterThan(0);
				expect(inst.after_update_called - inst.after_save_called).to.be.greaterThan(0);
			});

			it('are all blank by default', () => {
				[
				 'before_validate', 
				 'after_validate', 
				 'before_save', 
				 'after_save', 
				 'before_update', 
				 'after_update', 
				 'before_create', 
				 'after_create'
				].forEach((k) => expect(BaseModel[k]).to.eql([]))
			});
		});

	});



});