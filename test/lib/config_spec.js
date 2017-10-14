'use strict';

const expect = require('expect.js');
const config = require('../../lib/config');
const mock = require('mock-require');

describe('config(key, path)', ()=>{

	afterEach(()=>{
		delete process.env.DATABASE_URL
	});

	describe('when matching env variable exists', () => {
		it('loads the value from the env', ()=>{
			process.env.DATABASE_URL = 'from the environment';
			expect(config('database_url')).to.be('from the environment');
		});
	});

	describe('when no matching env variable exists', () => {
		describe('when key exists', () => {
			describe('when no path is provided', () => {
				it('loads config.json from the root directory and gets value for key', ()=>{
					expect(config('database_url')).to.be(require('../../config')['database_url']['test']);
				});

				describe('when no config file is at the default location', () => {

					it('throws a ConfigError', () => {
						mock('../../config.json', '../support/missing_default_config.js');
						let fn = () => { config('database_url') };
						expect(fn).to.throwException((e) => {
							expect(e.constructor.name).to.be('ConfigError');
							expect(e.message).to.match(/and default config file is missing/)
						});
						mock.stop('../../config.json');
					})
				});
			})

			describe('when a path is provided', () => {
				it('loads the config at the provided path', () => {
					expect(config('database_url','test/support/config.json')).to.be('mongodb://test');
				});

				describe('when the provided path does not exist', () => {
					it('raises a ConfigError', () => {
						let fn = () => {config('database_url', 'some/random/path')}
						expect(fn).to.throwException((e) => {
							expect(e.constructor.name).to.be('ConfigError');
							expect(e.message).to.match(/no config file present at/)
						});
					});
				});
			});
		});

		describe('when key does not exist', () => {
			it('raises a ConfigError', () => {
				let fn = ()=>{ config('some_key', 'test/support/config.json') };
				expect(fn).to.throwException((e) => {
					expect(e.constructor.name).to.be('ConfigError');
					expect(e.message).to.be(`\`SOME_KEY' is not set in the environment, and \`some_key' is not set in the provided config file for this environment`);
				});
			});
		});
	});
});