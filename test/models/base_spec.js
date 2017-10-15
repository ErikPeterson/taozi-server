'use strict';

const DB = require('../support/db_cleaner');
const BaseModel = require('../../models/base');
const FakeModel = require('../support/fake_model');
const Errors = require('../../lib/errors')
const expect = require('expect.js');

describe('ModelBase', () => {
	
	before(async () => {
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
			expect(inst.get('name')).to.be('farfignewton');
			expect(inst.get('options.hey')).to.be('now');
		});
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
				inst.set('options', {yes: 'no'});
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

	describe('persistence', () => {
		afterEach(async () => {
			await DB.clean();
		});

		describe('validations', () => {
			describe('.schema', () => {
				it('defaults to an empty hash', () => {
					expect(BaseModel.schema).to.eql({});
				});

				it('must be set on the inheriting model', () => {
					expect(FakeModel.schema).to.eql({
						name: '',
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

			describe('#valid', () => {
				describe('if the instance is not valid', () => {
					it('returns false and populates #errors', () => {
						let inst = new FakeModel({name: 1, options: { what: { yes: {}}}})
						expect(inst.valid).to.not.be.ok();
						expect(inst.errors.empty).to.not.be.ok();
					});
				});

				describe('if the instance is valid', () => {
					it('returns true and errors remain empty', () => {
						let inst = new FakeModel({name: 'hello', options: { what: { hello: { anything: 'goes'}}}});
						expect(inst.valid).to.be.ok();
						expect(inst.errors.empty).to.be.ok();
					});
				});
			});

			describe('#validate()', () => {
				describe('if the instance is not valid', () => {
					it('populates and returns errors', () => {
						let inst = new FakeModel({name: 1, options: { what: { yes: {}}}})
						let errs = inst.validate();
						expect(errs).to.be.an(Errors);
						expect(errs.empty).to.not.be.ok();
					});
				});

				describe('if the insance is valid', () => {
					it('returns the empty errors object', () => {
						let inst = new FakeModel({name: 'hello'});
						let errs = inst.validate();
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

		describe('#save()', () => {
			describe('with a new record', () => {
				it('saves the record to the database', async () => {
					let inst = new FakeModel({name: 'butthead'});
					await inst.save();
					expect(inst._id).to.be.ok();
				});
			});

			describe('with a persisted record', () => {
				it('updates the appropriate record', async () => {
					let inst = new FakeModel({name: 'wow', options: { hey: 'now'}});
					await inst.save();
					inst.set('name', 'shoot');
					inst.set('options:yes', 'no');
					await inst.save();
					expect(inst.changed).to.be(false);
					expect(inst.get('options:yes')).to.be('no');
					expect(inst.get('name')).to.be('shoot');
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

	});


});