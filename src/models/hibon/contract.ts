import { HiBON } from '.';
import { caclHash } from 'src/common/helpers';

export class Contract {
	in: string[];
	out: string[];
	contract: string;
	hash: string;
	amount: number;

	constructor(hibon: HiBON) {
		const { $contract: contract } = hibon.data.message.params;

		try {
			this.contract = hibon.base64;
			this.in = contract.$in.map((value) => value[1]) as string[];
			this.out = contract.$out.map((value) => value[1]) as string[];
			this.hash = caclHash(hibon.buffer);
			this.amount = parseInt(contract.$script.replace(/\D/g, ''));
		} catch (error) {
			throw new Error(`Failed to parse contract: ${JSON.stringify(error)}`);
		}
	}

	construct(buffer: Buffer) {}
}
