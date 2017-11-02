'use strict';

const expect = require('expect.js');
const _logger = require('../../lib/logger');

class FakeTransport{
	constructor(){
		this._log = [];
		this._error = [];
	}
	log(message){
		this._log.push(message);
	}
	error(message){
		this._error.push(message);
	}
}

describe('logger(opts)', () => {
	let transport = new FakeTransport();
	let {logger, middleware} = _logger({transport: transport});

	beforeEach(() => {
		transport = new FakeTransport();
		logger.transport = transport;
	});

	it('defaults to console as transport', () => {
		let loggeria = _logger().logger;
		expect(loggeria.transport).to.be(console);
	});

	it('can set the transport', () => {
		expect(logger.transport).to.be(transport);
	});

	describe('async .middleware(ctx, next)', () => {
		it('records request information in the log', async () => {
			let ctx = {
				request: {
					method: 'POST',
					path: '/'
				},
				response: {
					status: 200
				}
			};
			let called = false;

			let next = async function(){ called = true};
			await middleware(ctx, next);
			expect(called).to.be(true);
			expect(transport._log[0]).to.match(/Started POST for \//);
			expect(transport._log[1]).to.match(/Completed 200 in /);
			
		});
	});

	describe('.logger', () => {
				
		it('is an instance of Logger', () => {
			expect(logger.constructor.name).to.be('Logger');
		});

		describe('#log(level, message)', () => {
			it('logs the message at level', () => {
				logger.log('debug', 'my message');
				expect(transport._log[0]).to.match(/\[DEBUG\]  my message/);
				logger.log('error', 'some error');
				expect(transport._error[0]).to.match(/\[ERROR\]  some error/);
			});

			it('defaults to INFO', () => {
				logger.log(undefined, 'my message');
				expect(transport._log[0]).to.match(/\[INFO\]  my message/);
			});

			it('does nothing if index is below LOG_LEVEL', () => {
				process.env.LOG_LEVEL = 6;
				logger.log('INFO', 'message');
				delete process.env.LOG_LEVEL;
				expect(transport._log).to.be.empty();
			});

		});

		describe('#debug(message), #info(message), #warn(message)', () => {
			it('passes message to log', () => {
				['DEBUG', 'INFO', 'WARN'].forEach((level) => {
					logger[level.toLowerCase()]('message');
					expect(transport._log[transport._log.length - 1]).to.match(new RegExp(`\\[${level}\\]  message`));
				});
			});
		});

		describe('#error(message, err)', () => {

			it('processes the provided error into a message', () => {
				let error = {
					message: 'my message',
					stack: ['stackity stacks', 'dont talk back']
				}
				logger.error('butt', error);
				expect(transport._error[0]).to.match(/\[ERROR\]  my message/);
				expect(transport._error[0]).to.match(/stackity stacks/);
				expect(transport._error[0]).to.match(/dont talk back/);
			});

			it('does not require the error object to be an actual error', () => {
				let error = {
					message: 'my message'
				};

				logger.error('butt', error);
				expect(transport._error[0]).to.match(/\[ERROR\]  my message/);
			});

			it('does not require an error object', () => {
				logger.error('butt butt');
				expect(transport._error[0]).to.match(/\[ERROR\]  butt butt/);
			});

		});

		describe('#fatal(message, err)', () => {
			it('processes the provided error into a message', () => {
				let error = {
					message: 'my message',
					stack: ['stackity stacks', 'dont talk back']
				}
				logger.fatal('butt', error);
				expect(transport._error[0]).to.match(/\[FATAL\]  my message/);
				expect(transport._error[0]).to.match(/stackity stacks/);
				expect(transport._error[0]).to.match(/dont talk back/);
			});

			it('does not require the error object to be an actual error', () => {
				let error = {
					message: 'my message'
				};

				logger.fatal('butt', error);
				expect(transport._error[0]).to.match(/\[FATAL\]  my message/);
			});

			it('does not require an error object', () => {
				logger.fatal('butt butt');
				expect(transport._error[0]).to.match(/\[FATAL\]  butt butt/);
			});
		});

	});
});