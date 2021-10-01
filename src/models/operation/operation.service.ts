import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { DevToolService } from 'src/models/devtool';

import { PushSub, ParsedContract, CheckContractResponse } from './index.dto';

@Injectable()
export class OperationService {
	keys: { [key: string]: string[] } = {}; // Hash of pubkey to sub
	subs: { [key: string]: PushSub } = {}; // Hash of contract to sub

	constructor(private readonly devtoolService: DevToolService, private readonly logger: Logger) {}

	getLog(): string {
		console.log('Hello Operation Controller log');

		return 'check contract controller';
	}

	async checkContract(contract: string, returnParsed = false) {
		this.logger.debug(`ensureParsedContractSub(contract: ${contract}, returnParsed: ${returnParsed})`);

		// await this.loadState();

		const parsedContract = await this.parseContract(contract);

		let inputsUsed = false;
		let outputsUsed = false;

		for (let i = 0; i < parsedContract.in.length; i++) {
			const key = parsedContract.in[i];
			if (this.keys[key] !== undefined) {
				inputsUsed = true;
				break;
			}
		}

		for (let i = 0; i < parsedContract.out.length; i++) {
			const key = parsedContract.out[i];
			if (this.keys[key] !== undefined) {
				const subs = this.keys[key];
				for (let s = 0; s < subs.length; s++) {
					const sub = subs[s];
					// Only say it's used if it's in the contract
					// if it's subscribed as invoice - it's expected
					if (this.subs[sub]?.contract) {
						outputsUsed = true;
						break;
					}
				}
				break;
			}
		}
		const response: CheckContractResponse = { ok: true, inputsUsed, outputsUsed, parsedContract: parsedContract };

		if (!returnParsed) delete response.parsedContract;

		return response;
	}

	async parseContract(contractBase64: string) {
		try {
			const jsonString = await this.devtoolService.hibonToJson(contractBase64);
			if (jsonString == false) {
				throw `Couldn't convert to JSON`;
			}
			const json = JSON.parse(jsonString);

			const hash = this.caclHash(contractBase64);
			const contract = json['$msg']['params']['$contract'];
			const result: ParsedContract = {
				in: [],
				out: [],
				contract: contractBase64,
				hash,
				amount: parseInt(contract['$script'].split(' ')[0]),
			};
			const inKeys = contract['$in'];
			const outKeys = contract['$out'];

			const inKeysPure = inKeys.map((value) => value[1]) as string[];
			const outKeysPure = outKeys.map((value) => value[1]) as string[];

			result.in = inKeysPure;
			result.out = outKeysPure;

			return result;
		} catch (e) {
			throw new Error(`Failed to parse contract: ${JSON.stringify(e)}`);
		}
	}

	caclHash(value: string) {
		const shasum = crypto.createHash('sha1');

		shasum.update(value);

		return shasum.digest('hex');
	}
}
