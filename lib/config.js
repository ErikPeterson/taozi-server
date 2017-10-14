'use strict';

const MISSING_FILE_REG=/Cannot find module/;

class ConfigError extends Error {
	static missingProperty(key){
		return new ConfigError(`\`${key.toUpperCase()}' is not set in the environment, and \`${key.toLowerCase()}' is not set in the provided config file for this environment`);
	}

	static missingConfigFile(key, path){
		let message = path === 'config.json' ? `\`${key.toUpperCase()}' is not set in the environment, and default config file is missing, and no path provided` : `\`${key.toUpperCase()}' is not set in the environment, and no config file present at ${resolvePath(path)}`;
		return new ConfigError(message);
	}
}

const resolvePath = (pathname) => {
	const join = require('path').join;
	const isAbsolute = require('path').isAbsolute;

	return isAbsolute(pathname) ? pathname : join(__dirname, '..', pathname);
};

const config = (key, path='config.json') => {
	let env = (process.env['NODE_ENV'] || 'development').toLowerCase();
	if(process.env[key.toUpperCase()]) return process.env[key.toUpperCase()];

	try{
		return require(resolvePath(path))[key.toLowerCase()][env];
	} catch(e) {
		switch(e.constructor.name){
			case 'TypeError':
				throw ConfigError.missingProperty(key);
				break;
			default:
				if(MISSING_FILE_REG.test(e.message)) throw ConfigError.missingConfigFile(key, path);
				throw e;
		}
	}
};

module.exports = config;