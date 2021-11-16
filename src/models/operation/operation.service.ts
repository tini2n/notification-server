import { Injectable, Logger } from '@nestjs/common';

import { calcHash } from 'src/common/helpers';

import { PushService } from 'src/models/push';
import { FirebaseService } from 'src/models/firebase';

import { HiBON, Contract, Invoice } from 'src/models/hibon';

import { PushSub, ParsedContract, ParsedInvoice, CheckContractResponse } from './index.dto';

import { FirebaseMessageTypes } from 'src/models/firebase';

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

		let parsedContract: Contract;

		try {
			const contractHiBON = await HiBON.constructByBase64(contract);

			parsedContract = new Contract(contractHiBON);
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		const response: CheckContractResponse = {
			ok: true,
			inputsUsed: false,
			outputsUsed: false,
			...(returnParsed && { parsedContract }),
		};

		for (let publicInput of parsedContract.in) {
			const contractFromDb = await this.firebaseService.getPublicKeyByHash(publicInput);

			if (contractFromDb.exists()) {
				response.inputsUsed = true;

				break;
			}
		}

		// todo: Preconfirmation. Notify about invoice
		// Check input output from DB

		// for (let i = 0; i < parsedContract.in.length; i++) {
		// 	const key = parsedContract.in[i];

		// 	if (this.keys[key] !== undefined) {
		// 		response.inputsUsed = true;

		// 		break;
		// 	}
		// }

		for (let publicOutput of parsedContract.out) {
			const publicKeyFromDb = await this.firebaseService.getPublicKeyByHash(publicOutput),
				publicKey = await publicKeyFromDb.val();

			if (publicKeyFromDb.exists()) {
				for (let contractHash of publicKey.contracts) {
					const contractFromDb = await this.firebaseService.getContractByHash(contractHash),
						contractVal = await contractFromDb.val();

					if (contractVal.contract) {
						response.outputsUsed = true;

						break;
					}
				}
			}
		}

		// for (let i = 0; i < parsedContract.out.length; i++) {
		// 	const key = parsedContract.out[i];

		// 	if (this.keys[key] !== undefined) {
		// 		const subs = this.keys[key];

		// 		for (let s = 0; s < subs.length; s++) {
		// 			const sub = subs[s];

		// 			// Only say it's used if it's in the contract
		// 			// if it's subscribed as invoice - it's expected
		// 			if (this.subs[sub]?.contract) {
		// 				response.outputsUsed = true;
		// 				break;
		// 			}
		// 		}
		// 		break;
		// 	}
		// }

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

	async ensureParsedContractToken(parsedContract: Contract, deviceToken: string) {
		this.logger.debug(
			`ensureParsedContractToken(parsedContract: ${JSON.stringify(parsedContract)}, deviceToken: ${deviceToken})`,
		);

		// const sessionId = this.tagionwaveService.latestNetworkInfo?.sessionId;
		const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id

		if (!sessionId) return { ok: false };

		try {
			const contractFromDb = await this.firebaseService.getContractByHash(parsedContract.hash),
				contract = await contractFromDb.val();

			if (contractFromDb.exists()) {
				if (!contract.subscribers.find(deviceToken)) {
					await this.firebaseService.setContractSubscribersByHash(parsedContract.hash, [
						...contract.subscribers,
						deviceToken,
					]);

					return { ok: true, existedBefore: true };
				}

				return { ok: true, resolved: { contract: parsedContract.hash, ...contract } };
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		const contractKeys = [
			...parsedContract.in.map((input) => calcHash(Buffer.from(input, 'base64'))),
			...parsedContract.out.map((output) => calcHash(Buffer.from(output, 'base64'))),
		];

		await this.firebaseService.setContractByHash(parsedContract.hash, {
			...parsedContract,
			keys: contractKeys,
			expiration: new Date(Date.now() + 10 * 60000).toString(),
			subscribers: [deviceToken],
		});

		try {
			for (let publicKey of contractKeys) {
				const publicKeyFromDb = await this.firebaseService.getPublicKeyByHash(publicKey),
					publicKeyValue = await publicKeyFromDb.val();

				if (publicKeyFromDb.exists()) {
					if (!publicKeyValue.contracts.find(parsedContract.hash)) {
						await this.firebaseService.setPublicKeyContractsByHash(publicKey, [
							...publicKeyValue.contracts,
							parsedContract.hash,
						]);
					}
				} else {
					await this.firebaseService.setPublicKeyByHash(publicKey, { contracts: [parsedContract.hash] });
				}
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		await this.notifyInvoiceTokenContractSent(parsedContract);

		return { ok: true, existedBefore: false };
	}

	async ensureParsedInvoiceToken(parsedInvoice: Invoice, deviceToken: string) {
		this.logger.debug(
			`ensureParsedContractSub(parsedInvoice: ${JSON.stringify(parsedInvoice)}, subscriber: ${deviceToken})`,
		);
		// await this.loadState();

		let pushSub: PushSub;

		// const sessionId = this.tagionwaveService.latestNetworkInfo?.sessionId;
		const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id

		if (!sessionId) return { ok: false };

		// const fromDb = await this.firebaseService.getInvoiceByHash({ sessionId, hash: parsedInvoice.hash });

		try {
			const invoiceFromDb = await this.firebaseService.getInvoiceByHash(parsedInvoice.hash),
				invoice = await invoiceFromDb.val();

			if (invoiceFromDb.exists()) {
				if (!invoice.subscribers.find(deviceToken)) {
					invoice.subscribers.push(deviceToken);

					this.firebaseService.setInvoiceSubscribersByHash(parsedInvoice.hash, [...invoice.subscribers]);
				}

				return { ok: true, resolved: { invoice: parsedInvoice.hash, ...invoice } };
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		// if (this.subs[parsedInvoice.hash] !== undefined) {
		// 	pushSub = this.subs[parsedInvoice.hash];

		// 	if (pushSub.subscribers.indexOf(deviceToken) == -1) {
		// 		pushSub.subscribers.push(deviceToken);
		// 	}

		// 	// await this.saveState();

		// 	return { ok: true };
		// }

		const expiration = new Date(Date.now() + 10 * 60000).toString();

		pushSub = {
			hash: parsedInvoice.hash,
			invoice: parsedInvoice.invoice,
			keys: parsedInvoice.keys,
			expiration,
			subscribers: [deviceToken],
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

	async ensureContractToken(contract: string, deviceToken: string) {
		this.logger.debug(`ensureContractSub(contract: ${contract}, sub: ${deviceToken})`);

		const contractHiBON = await HiBON.constructByBase64(contract),
			parsedContract = new Contract(contractHiBON);

		return this.ensureParsedContractToken(parsedContract, deviceToken);
	}

	async ensureInvoiceToken(invoice: string, deviceToken: string) {
		this.logger.debug(`ensureInvoiceSub(contract: ${invoice}, sub: ${deviceToken})`);

		const invoiceHiBON = await HiBON.constructByBase64(invoice),
			parsedInvoice = new Invoice(invoiceHiBON);

		return this.ensureParsedInvoiceToken(parsedInvoice, deviceToken);
	}

	async notifyInvoiceTokenContractSent(parsedContract: Contract) {
		this.logger.debug(`notifyInvoiceTokenContractSent(parsedContract: ${JSON.stringify(parsedContract)})`);

		for (let publicOutput of parsedContract.out) {
			const publicKeyFromDb = await this.firebaseService.getPublicKeyByHash(publicOutput),
				publicKey = await publicKeyFromDb.val();

			for (let contractHash of publicKey.contracts) {
				const contractFromDb = await this.firebaseService.getContractByHash(contractHash),
					contract = await contractFromDb.val();

				if (contractFromDb.exists() && !!contract.invoice) {
					for (let subscriber of contract.subscribers) {
						const messagingResponse = await this.pushService.sendToDevice(subscriber, {
							type: FirebaseMessageTypes.InvoicePending,
							invoice: contract.hash,
							amount: parsedContract.amount.toString(),
						});

						this.logger.log(JSON.stringify(messagingResponse));
					}
				}
			}
		}

		// for (let i = 0; i < parsedContract.out.length; i++) {
		// 	const key = parsedContract.out[i];
		// 	const subHashes = this.keys[key];

		// 	for (let h = 0; h < subHashes.length; h++) {
		// 		const subHash = subHashes[h];
		// 		const sub = this.subs[subHash];

		// 		if (sub !== undefined && sub.invoice) {
		// 			for (let s = 0; s < sub.subscribers.length; s++) {
		// 				const subToken = sub.subscribers[s];

		// 				const messagingResponse = await this.pushService.sendToDevice(subToken, {
		// 					type: FirebaseMessageTypes.InvoicePending,
		// 					invoice: sub.hash,
		// 					amount: parsedContract.amount.toString(),
		// 				});

		// 				this.logger.log(JSON.stringify(messagingResponse));
		// 			}
		// 		}
		// 	}
		// }
	}
}
