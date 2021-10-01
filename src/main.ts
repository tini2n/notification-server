import { NestFactory } from '@nestjs/core';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

import { AppModule } from './app.module';

import { timestamp } from './common/helpers';

const logFormat = winston.format.printf(function (info) {
	if (typeof info.message === 'object') {
		info.message = JSON.stringify(info.message, null, 4);
	}

	return `${info.context} - ${info.level} | ${info.message}`;
});

class Server {
	logLevel = process.env.LOG_LEVEL || 'info';

	async run() {
		const logFileConfig = {
			filename: `logs_from_${timestamp()}.txt`,
			dirname: process.env.LOG_DIR || './logs/',
			zippedArchive: false,
			maxFiles: 10,
			eol: '\n',
			tailable: true,
			format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
		};

		const app = await NestFactory.create(AppModule, {
			logger: WinstonModule.createLogger({
				level: this.logLevel,
				format: winston.format.simple(),
				transports: [
					new winston.transports.Console({
						format: winston.format.combine(winston.format.colorize(), logFormat),
					}),
					new winston.transports.File(logFileConfig),
				],
			}),
		});

		app.enableCors({ origin: '*' });

		await app.listen(3000);
	}
}

const server = new Server();

server.run();
