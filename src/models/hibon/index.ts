import * as fs from 'fs';
import * as path from 'path';

import { execPromise } from 'src/common/helpers';

export class HiBON {
	private static tempPath = path.resolve(process.cwd(), 'tmp');

	protected constructor(private _buffer: Buffer, private _data: any) {}

	static async construct(buffer: Buffer): Promise<HiBON> {
		const string = await HiBON.utilsProcessing(buffer);

		const data = JSON.parse(string);
		return new this(buffer, data);
	}
	static async constructByBase64(base64Str: string): Promise<HiBON> {
		const buffer = Buffer.from(base64Str, 'base64');

		return await HiBON.construct(buffer);
	}

	private static pathValidation() {
		if (!fs.existsSync(HiBON.tempPath)) {
			fs.mkdirSync(HiBON.tempPath);
		}
	}

	private static async utilsProcessing(buffer: Buffer): Promise<string> {
		const fileName = Date.now().toString() + '.hibon',
			lfile = path.resolve(this.tempPath, fileName);

		try {
			HiBON.pathValidation();
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		fs.writeFileSync(lfile, buffer);

		try {
			const stdout = await execPromise(`tagionhibonutil ${lfile}`),
				result = stdout.replace('start read\nend read\ndoc created\n', ''); // replacing unnececary info

			fs.unlinkSync(lfile);

			return result;
		} catch (error) {
			console.error(JSON.stringify(error));
		}
	}

	get buffer() {
		return this._buffer;
	}

	get data() {
		return this._data;
	}

	get base64() {
		return JSON.stringify(this.data);
	}
}

export { Contract } from './contract';
export { Invoice } from './invoice';
