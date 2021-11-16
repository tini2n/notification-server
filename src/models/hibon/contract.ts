import { HiBON } from '.';
import { calcHash } from 'src/common/helpers';

export class Contract {
	in: string[];
	out: string[];
	keys?: string[];
	contract: string;
	hash: string;
	amount: number;
	subscribers?: string[];
	expiration?: string[];

	constructor(hibon: HiBON) {
		const { $contract: contract } = hibon.data.message.params;

		try {
			this.contract = hibon.base64;
			this.in = contract.$in.map((value) => value[1]) as string[];
			this.out = contract.$out.map((value) => value[1]) as string[];
			this.hash = calcHash(hibon.buffer);
			this.amount = parseInt(contract.$script.split(' ')[0]);
		} catch (error) {
			throw new Error(`Failed to parse contract: ${JSON.stringify(error)}`);
		}
	}

	construct(buffer: Buffer) {}
}
