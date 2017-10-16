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

	it('can set the transport', () => {
		expect(logger.transport).to.be(transport);
	});

	describe('.middleware(ctx, next)', () => {
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

		it('responds to log(level, message)', () => {
			logger.log('debug', 'my message');
			expect(transport._log[0]).to.match(/\[DEBUG\]  my message/);
			logger.log('error', 'some error');
			expect(transport._error[0]).to.match(/\[ERROR\]  some error/);
		});

		it('responds to debug, info, warn', () => {
			['DEBUG', 'INFO', 'WARN'].forEach((level) => {
				logger[level.toLowerCase()]('message');
				expect(transport._log[transport._log.length - 1]).to.match(new RegExp(`\\[${level}\\]  message`));
			});
		});

		it('responds to error(message, err)', () => {
			let error = {
				message: 'my message',
				stack: ['stackity stacks', 'dont talk back']
			}
			logger.error('butt', error);
			expect(transport._error[0]).to.match(/\[ERROR\]  my message/);
			expect(transport._error[0]).to.match(/stackity stacks/);
			expect(transport._error[0]).to.match(/dont talk back/);
		});
	});
});