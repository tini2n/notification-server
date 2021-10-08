import { Logger } from '@nestjs/common';

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as tls from 'tls';
import * as path from 'path';

import { SSL_KEY, SSL_CERT, SSL_CA } from 'src/common/constants';
import { resolvePath, fileTemp } from 'src/common/helpers';

import { UtilType } from './index.dto';

const sslOptions = {
	key: fs.readFileSync(SSL_KEY, 'utf8').replace(/\\n/gm, '\n'),
	cert: fs.readFileSync(SSL_CERT, 'utf8').replace(/\\n/gm, '\n'),
	ca: fs.readFileSync(SSL_CA, 'utf8').replace(/\\n/gm, '\n'),
};

export class DevToolService {
	postUtilQueue = {
		0: [],
		1: [],
		2: [],
		3: [],
		4: [],
		5: [],
	};

	constructor(private readonly logger: Logger) {}

	async hibonToJson(hibon: string) {
		const ldir = this.dirTempFiles(false);
		const cdir = this.dirTempFiles(true);

		const buff = Buffer.from(hibon, 'base64');

		const randomName = Date.now().toString() + '.hibon';

		const lfile = fileTemp(ldir, randomName);
		const cfile = fileTemp(cdir, randomName);

		fse.ensureDirSync(ldir);

		fs.writeFileSync(lfile, buff);

		const response = await this.postUtil(3, null, `${cfile}`);
		console.log('response', response);

		if (!response.success) {
			this.logger.log(`Initial DART dump was not successful...`);
			if (response.error) this.logger.log(`Error: ${response.error}`);
			return false;
		}

		fs.unlinkSync(lfile);
		return response.result;
	}

	private dirTempFiles(container = false) {
		return resolvePath(container, 'general', `tempfiles`);
	}

	postUtil(utilType: UtilType, sessionId: string = '', ...args: any[]) {
		// this.logger.debug(`postUtil(utilType = ${utilType}, sessionId = ${sessionId}, args = [${args.join(', ')})]`); // todo: sessionID
		console.log('utilType', utilType, args, sessionId);
		
		if (!sessionId) sessionId = undefined;
		
		let postPromiseResolve = undefined;
		let postPromiseReject = undefined;
		
		const postPromise = new Promise<{
			success: boolean;
			result: string;
			error: string;
			status: number;
		}>((resolve, reject) => {
			postPromiseResolve = resolve;
			postPromiseReject = reject;
		});

		console.log(postPromise);
		
		
		this.postUtilQueue[utilType].push({
			promise: postPromise,
			resolve: postPromiseResolve,
			reject: postPromiseReject,
			sessionId,
			args,
			utilType,
		});
		
		return postPromise;
	}

	sendHiRPC(buff: Buffer, port: number) {
		return new Promise((resolve, reject) => {
			this.logger.debug(`Sending HiRPC...`);
			const connection = tls.connect(port, '127.0.0.1', sslOptions, () => {
				const wrote = connection.write(buff);
				this.logger.debug(`Sent HiRPC: ${wrote}`);
			});

			connection.on('data', (data) => {
				this.logger.debug(`Received HiRPC response: ${data?.toString()}`);
				connection.end();
				resolve(data);
			});

			connection.on('error', (error) => {
				this.logger.debug(`Received HiRPC error: ${JSON.stringify(error)}`);
				reject(`Error: ${JSON.stringify(error)}`);
			});
		});
	}
}
