import { Logger } from '@nestjs/common';

import * as fs from 'fs';
import * as fse from 'fs-extra';

import { resolvePath, fileTemp } from 'src/common/helpers';

import { UtilType } from './index.dto';

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

	postUtil(utilType: UtilType, sessionId: string, ...args: any[]) {
		this.logger.debug(`postUtil(utilType = ${utilType}, sessionId = ${sessionId}, args = [${args.join(', ')})]`);

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
}
