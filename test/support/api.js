'use strict';

const app = require('../../index');
const _ = require('lodash');
const request = require('request-promise-native');

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json'
};

var OG_LOG_LEVEL = process.env['LOG_LEVEL'];

const silence_logs = () => {
	OG_LOG_LEVEL = process.env['LOG_LEVEL'];
	process.env['LOG_LEVEL'] = 'FATAL';
};

const unsilence_logs = () => {
	process.env['LOG_LEVEL'] = OG_LOG_LEVEL;
};

const getPort = () => Math.floor(Math.random() * (4000 - 3000 + 1) + 3000);

const _send_request = (address, method, params, headers) => {
	let opts = {
		url: address,
		method: method,
		body: params,
		json: true,
		headers: headers,
		resolveWithFullResponse: true
	};

	return request(opts).then((resp, somethin) => {
		return resp;
	}).catch((e) => {
		return e.response;
	});
};

class API {

	static async request(method, path, params={}, headers={}){
		let port = getPort();
		path = /^\//.test(path) ? path : '/' + path;
		headers = _.merge({}, DEFAULT_HEADERS, headers);
		silence_logs()
		let server = app.listen(port);
		let resp = '';

		try{
			resp = await _send_request(`http://localhost:${port}${path}`, method, params, headers);
		} catch(e){
			await server.close();
			unsilence_logs();
			throw e;
		}
		await server.close();
		unsilence_logs();
		return resp;
	}

	static async get(path, params, headers){
		return await API.request('GET', path, params, headers);
	}

	static async post(path, params, headers){
		return await API.request('POST', path, params, headers);
	}

	static async delete(path, headers){
		return await API.request('DELETE', path, undefined, headers)
	}

};

module.exports = API;