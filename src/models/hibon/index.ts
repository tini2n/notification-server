import * as fs from 'fs';
import * as path from 'path';

import { execPromise } from 'src/common/helpers';

export class Hibon {
	buffer = null;

	private tempPath = path.resolve(process.cwd(), 'tmp');

	constructor(buffer: Buffer) {
		this.buffer = buffer;
	}

	static construct(buffer: Buffer) {
		return new this(buffer);
	}

	private pathValidation() {
		if (!fs.existsSync(this.tempPath)) {
			fs.mkdirSync(this.tempPath);
		}
	}

	private async utilsProcessing(): Promise<string> {
		const fileName = Date.now().toString() + '.hibon',
			lfile = path.resolve(this.tempPath, fileName);

		try {
			this.pathValidation();
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		fs.writeFileSync(lfile, this.buffer);

		try {
			const stdout = await execPromise(`tagionhibonutil ${lfile}`),
				result = stdout.replace('start read\nend read\ndoc created\n', ''); // replacing unnececary info

			fs.unlinkSync(lfile);

			return result;
		} catch (error) {
			console.error(JSON.stringify(error));
		}
	}

	async data(): Promise<any> {
		try {
			const string = await this.utilsProcessing();

			return JSON.parse(string);
		} catch (error) {
			console.error(JSON.stringify(error));
		}
	}
}
