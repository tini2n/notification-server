import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { exec, execSync } from 'child_process';

import { PushService } from 'src/models/push';
import { FirebaseService } from 'src/models/firebase';

import { Hibon } from 'src/models/hibon';

import { PushSub, ParsedContract, ParsedInvoice, CheckContractResponse } from './index.dto';

import { FirebaseMessageTypes } from 'src/models/firebase';

// mocks
import { UTIL_HIBON_PARSED } from 'src/common/constants/mocks';

@Injectable()
export class OperationService {
	keys: { [key: string]: string[] } = {}; // Hash of pubkey to sub
	subs: { [key: string]: PushSub } = {}; // Hash of contract to sub

	constructor(
		private readonly pushService: PushService,
		private readonly firebaseService: FirebaseService,
		private readonly logger: Logger,
	) {}

	async checkContract(contract: string, returnParsed = false) {
		this.logger.debug(`checkContract(contract: ${contract}, returnParsed: ${returnParsed})`);

		// await this.loadState();

		let parsedContract;

		try {
			parsedContract = await this.parseContract(contract);
		} catch (error) {
			console.error(error);
		}

		const response: CheckContractResponse = {
			ok: false,
			inputsUsed: false,
			outputsUsed: false,
			parsedContract,
		};

		for (let i = 0; i < parsedContract.in.length; i++) {
			const key = parsedContract.in[i];
			if (this.keys[key] !== undefined) {
				response.inputsUsed = true;
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
						response.outputsUsed = true;
						break;
					}
				}
				break;
			}
		}

		if (!returnParsed) delete response.parsedContract;

		return response;
	}

	async sendContract({ contract, deviceToken }: { contract: string; deviceToken: string }) {
		this.logger.debug(`sendContract(contract: ${contract}, sub: ${deviceToken})`);

		const contractCheckResult = await this.checkContract(contract, true);

		if (contractCheckResult.inputsUsed || contractCheckResult.outputsUsed) {
			contractCheckResult.ok = false;
			return contractCheckResult;
		}

		try {
			// todo: Buffer type
			// const response = await this.devtoolService.sendHiRPC(
			// 	Buffer.from(contract, 'base64'),
			// 	// this.tagionwaveService.latestNetworkInfo.nodes[0].port,
			// 	3000, // mock tagionwave latestNetworkInfo node port
			// );
			const response: Buffer = Buffer.from(contract, 'base64');
			const resp = {
				mockedResponse: 'somestring',
			};

			this.logger.log(resp?.toString());
		} catch (error) {
			return { ok: false, error };
		}

		if (!deviceToken) return { ok: true };

		const ensureSubResult = await this.ensureParsedContractToken(contractCheckResult.parsedContract, deviceToken);

		return ensureSubResult;
	}

	async ensureParsedContractToken(parsedContract: ParsedContract, deviceToken: string) {
		this.logger.debug(
			`ensureParsedContractToken(parsedContract: ${JSON.stringify(parsedContract)}, deviceToken: ${deviceToken})`,
		);
		// await this.loadState();

		let pushSub: PushSub;

		// const sessionId = this.tagionwaveService.latestNetworkInfo?.sessionId;
		const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id

		if (!sessionId) return { ok: false };

		// to-to: add notification interlayer service
		const fromDb = await this.firebaseService.getContractByHash({ sessionId, hash: parsedContract.hash }); // todo: model of BD data ???

		if (fromDb.exists()) {
			return { ok: true, resolved: { contract: parsedContract.hash, ...fromDb.val() } };
		}

		if (this.subs[parsedContract.hash] !== undefined) {
			pushSub = this.subs[parsedContract.hash];

			if (pushSub.subs.indexOf(deviceToken) == -1) {
				pushSub.subs.push(deviceToken);
			}

			// await this.saveState();
			return { ok: true, existedBefore: true };
		}

		const expiration = new Date(Date.now() + 10 * 60000).toString();

		pushSub = {
			hash: parsedContract.hash,
			contract: parsedContract.contract,
			keys: [...parsedContract.in, ...parsedContract.out],
			in: [...parsedContract.in],
			out: [...parsedContract.out],
			expiration,
			subs: [deviceToken],
		};

		this.subs[pushSub.hash] = pushSub;

		for (let i = 0; i < pushSub.keys.length; i++) {
			const pushSubKey = pushSub.keys[i];
			if (this.keys[pushSubKey] !== undefined) {
				if (this.keys[pushSubKey].indexOf(pushSub.hash) == -1) {
					this.keys[pushSubKey].push(pushSub.hash);
				}
			} else {
				this.keys[pushSubKey] = [pushSub.hash];
			}
		}

		// await this.saveState();
		await this.notifyInvoiceTokenContractSent(parsedContract);

		return { ok: true, existedBefore: false };
	}

	async ensureParsedInvoiceToken(parsedInvoice: ParsedInvoice, sub: string) {
		this.logger.debug(`ensureParsedContractSub(parsedInvoice: ${JSON.stringify(parsedInvoice)}, sub: ${sub})`);
		// await this.loadState();

		let pushSub: PushSub;

		// const sessionId = this.tagionwaveService.latestNetworkInfo?.sessionId;
		const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id

		if (!sessionId) return { ok: false };

		const fromDb = await this.firebaseService.getInvoiceByHash({ sessionId, hash: parsedInvoice.hash });
		if (fromDb.exists()) {
			return { ok: true, resolved: { invoice: parsedInvoice.hash, ...fromDb.val() } };
		}

		if (this.subs[parsedInvoice.hash] !== undefined) {
			pushSub = this.subs[parsedInvoice.hash];

			if (pushSub.subs.indexOf(sub) == -1) {
				pushSub.subs.push(sub);
			}

			// await this.saveState();
			return { ok: true };
		}

		const expiration = new Date(Date.now() + 10 * 60000).toString();

		pushSub = {
			hash: parsedInvoice.hash,
			invoice: parsedInvoice.invoice,
			keys: parsedInvoice.keys,
			expiration,
			subs: [sub],
		};

		this.subs[pushSub.hash] = pushSub;

		for (let i = 0; i < pushSub.keys.length; i++) {
			const pushSubKey = pushSub.keys[i];
			if (this.keys[pushSubKey] !== undefined) {
				if (this.keys[pushSubKey].indexOf(pushSub.hash) == -1) {
					this.keys[pushSubKey].push(pushSub.hash);
				}
			} else {
				this.keys[pushSubKey] = [pushSub.hash];
			}
		}

		// await this.saveState();
		return { ok: true };
	}

	async parseContract(contractBase64: string) {
		try {
			const contractBuffer = Buffer.from(contractBase64, 'base64');
			const hash = this.caclHash(contractBase64);

			const hibon = Hibon.construct(contractBuffer);
			const hibonData = await hibon.data();

			const { $contract: contract } = hibonData.message.params;

			return {
				in: contract.$in.map((value) => value[1]) as string[],
				out: contract.$out.map((value) => value[1]) as string[],
				contract: contractBase64,
				hash,
				amount: parseInt(contract.$script.split(' ')[0]),
			} as ParsedContract;
		} catch (error) {
			throw new Error(`Failed to parse contract: ${JSON.stringify(error)}`);
		}
	}

	async parseInvoice(invoiceBase64: string) {
		try {
			// const jsonString = await this.devtoolService.hibonToJson(invoiceBase64);
			const jsonString = 'somejsonstring';

			if (!jsonString) {
				throw `Couldn't convert to JSON`;
			}
			const json = JSON.parse(jsonString);

			const parsedInvoice: ParsedInvoice = {
				hash: this.caclHash(invoiceBase64),
				invoice: invoiceBase64,
				keys: [json[0]['pkey'][1]],
			};
			return parsedInvoice;
		} catch (e) {
			throw new Error(`Failed to parse invoice: ${JSON.stringify(e)}`);
		}
	}

	async ensureContractToken(contract: string, deviceToken: string) {
		this.logger.debug(`ensureContractSub(contract: ${contract}, sub: ${deviceToken})`);

		const parsedContract = await this.parseContract(contract);

		return this.ensureParsedContractToken(parsedContract, deviceToken);
	}

	async ensureInvoice(invoice: string, deviceToken: string) {
		this.logger.debug(`ensureInvoiceSub(contract: ${invoice}, sub: ${deviceToken})`);

		const parsedInvoice = await this.parseInvoice(invoice);

		return this.ensureParsedInvoiceToken(parsedInvoice, deviceToken);
	}

	private caclHash(value: string) {
		const shasum = crypto.createHash('sha1');

		shasum.update(value);

		return shasum.digest('hex');
	}

	async notifyInvoiceTokenContractSent(parsedContract: ParsedContract) {
		this.logger.debug(`notifyInvoiceTokenContractSent(parsedContract: ${JSON.stringify(parsedContract)})`);

		for (let i = 0; i < parsedContract.out.length; i++) {
			const key = parsedContract.out[i];
			const subHashes = this.keys[key];

			for (let h = 0; h < subHashes.length; h++) {
				const subHash = subHashes[h];
				const sub = this.subs[subHash];

				if (sub !== undefined && sub.invoice) {
					for (let s = 0; s < sub.subs.length; s++) {
						const subToken = sub.subs[s];

						const messagingResponse = await this.pushService.sendToDevice(subToken, {
							type: FirebaseMessageTypes.InvoicePending,
							invoice: sub.hash,
							amount: parsedContract.amount.toString(),
						});

						this.logger.log(JSON.stringify(messagingResponse));
					}
				}
			}
		}
	}
}
