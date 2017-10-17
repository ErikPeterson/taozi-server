'use strict';

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const LOG_LEVEL = (() => {
    let level = process.env.LOG_LEVEL || 'DEBUG';
    if(LOG_LEVELS.indexOf(level) !== -1 ) return LOG_LEVELS.indexOf(level);
    return +level;
})();

const formatTime = (time) => {
    return time.toISOString();
};

const formatError = (err) => {
    let message = err.message;
    if(err.stack) message = message + '\n    ' + err.stack.join('\n    ');
    return message;
}

class Logger {
    constructor(opts={}){
        this.transport = opts.transport || console;
    }

    log(level='INFO', message){
        let time = new Date();
        level = level.toUpperCase();
        if(LOG_LEVELS.indexOf(level) < LOG_LEVEL) return;
        if(level === 'ERROR' || level === 'FATAL') {
            this.transport.error(this.formatMessage(time, level, message));
        } else {
            this.transport.log(this.formatMessage(time, level, message));
        }
    }

    debug(message){
        this.log('DEBUG', message);
    }
    
    info(message){
        this.log('INFO', message);
    }
    
    warn(message){
        this.log('WARN', message);
    }
    
    error(message, err){
        if(err){
            message = formatError(err);
        }
        this.log('ERROR', message);
    }

    fatal(message, err){
        if(err){
            message = formatError(err);
        }
        this.log('FATAL', message);
    }

    formatMessage(time, level, message){
        return `${formatTime(time)} [${level}]  ${message}`;
    }
}



module.exports = (opts) => {
    const logger = new Logger(opts);
    const middleware = async (ctx, next) => {
        let startTime = Date.now();
        logger.info(`Started ${ctx.request.method} for ${ctx.request.path}`);
        await next();
        let endTime = Date.now();
        logger.info(`Completed ${ctx.response.status} in ${endTime - startTime}ms`);
    };

    return { logger: logger, middleware: middleware };
};

