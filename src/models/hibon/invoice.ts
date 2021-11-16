import { HiBON } from '.';
import { calcHash } from 'src/common/helpers';

export class Invoice {
	hash: string;
	invoice: string;
	keys: string[];

	constructor(hibon: HiBON) {
		try {
			this.invoice = hibon.base64;
			this.hash = calcHash(hibon.buffer);
			this.keys = [hibon.data[0]['pkey'][1]];
		} catch (error) {
			throw new Error(`Failed to parse invoice: ${JSON.stringify(error)}`);
		}
	}
}
