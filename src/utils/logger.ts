import path from 'path';
import util from 'util';
import winston from 'winston';

const logFile = path.join(process.cwd(), 'server.log');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile })
  ]
});

const formatArgs = (args: unknown[]) => args.map(a => typeof a === 'string' ? a : util.inspect(a, { depth: 5 })).join(' ');

['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
  // @ts-ignore
  const original = console[method].bind(console);
  // @ts-ignore
  console[method] = (...args: unknown[]) => {
    const msg = formatArgs(args);
    if (method === 'log') {
      logger.info(msg);
    } else if ((logger as any)[method]) {
      // @ts-ignore
      (logger as any)[method](msg);
    } else {
      logger.info(msg);
    }
    try {
      original(...args);
    } catch (e) {
      // ignore if original console fails in closed environments
    }
  };
});
