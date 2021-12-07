import { Injectable, Logger } from '@nestjs/common';

import { calcHash } from 'src/common/helpers';

import { PushService } from 'src/models/push';
import { FirebaseService } from 'src/models/firebase';
import { NetworkService } from 'src/models/network';
import { StorageService } from 'src/models/storage';

import { HiBON, Contract, Invoice } from 'src/models/hibon';

import { CheckContractResponse } from './index.dto';

import { FirebaseMessageTypes } from 'src/models/firebase';

@Injectable()
export class OperationService {
	constructor(
		private readonly pushService: PushService,
		private readonly firebaseService: FirebaseService,
		private readonly storageService: StorageService,
		private readonly networkService: NetworkService,
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

		try {
			for (let publicInput of parsedContract.in) {
				const { exist } = await this.storageService.getPublicKey(publicInput);

				if (exist) {
					response.inputsUsed = true;

					break;
				}
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		try {
			for (let publicOutput of parsedContract.out) {
				const isUsed = await this.storageService.publicKeyWithContract(publicOutput);

				if (isUsed) {
					response.outputsUsed = true;

					break;
				}
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

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
			const contractHiBON = await HiBON.constructByBase64(contract);

			// const response = await this.networkService.sendHiRPC(contractHiBON.buffer);

			const resp = {
				mockedResponse: 'somestring',
			};

			this.logger.log(resp?.toString());
		} catch (error) {
			return { ok: false, error: JSON.stringify(error) };
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
		// const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id
		// if (!sessionId) return { ok: false };

		try {
			const response = await this.storageService.addContractSubscriber(parsedContract.hash, deviceToken);

			!!response && this.logger.debug(`addContractSubscriber(response: ${JSON.stringify(response)})`);

			if (response.existedBefore) return response;
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		// todo: Crypto hashing???

		const contractKeys = [
			...parsedContract.in.map((input) => encodeURIComponent(input)),
			...parsedContract.out.map((output) => encodeURIComponent(output)),
		];

		try {
			await this.storageService.addContract(parsedContract.hash, {
				...parsedContract,
				keys: contractKeys,
				expiration: new Date(Date.now() + 10 * 60000).toString(),
				subscribers: [deviceToken],
			});

			this.logger.debug(`addContract(hash: ${parsedContract.hash})`);
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		try {
			for (let publicKey of contractKeys) {
				await this.storageService.addPublicKeyContract(publicKey, parsedContract.hash);
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		try {
			await this.notifyInvoiceTokenContractSent(parsedContract);
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		return { ok: true, existedBefore: false };
	}

	async ensureParsedInvoiceToken(parsedInvoice: Invoice, deviceToken: string) {
		this.logger.debug(
			`ensureParsedContractSub(parsedInvoice: ${JSON.stringify(parsedInvoice)}, subscriber: ${deviceToken})`,
		);

		// const sessionId = this.tagionwaveService.latestNetworkInfo?.sessionId;
		// const sessionId = '94a191fe-25bc-11ec-9621-0242ac130002'; // mock tagionwave latestNetworkInfo session id
		// if (!sessionId) return { ok: false };

		try {
			const invoiceFromDb = await this.firebaseService.getInvoiceByHash(parsedInvoice.hash),
				invoice = await invoiceFromDb.val();

			if (invoiceFromDb.exists()) {
				if (!invoice.subscribers.find((s) => s === deviceToken)) {
					await this.firebaseService.setInvoiceSubscribersByHash(parsedInvoice.hash, [
						...invoice.subscribers,
						deviceToken,
					]);
				}

				return { ok: true, resolved: { invoice: parsedInvoice.hash, ...invoice } };
			}
		} catch (error) {
			console.error(JSON.stringify(error));
		}

		this.firebaseService.setInvoiceByHash(parsedInvoice.hash, {
			...parsedInvoice,
			expiration: new Date(Date.now() + 10 * 60000).toString(),
			subscribers: [deviceToken],
		});

		for (let publicKey of parsedInvoice.keys) {
			const publicKeyHash = encodeURIComponent(publicKey);
			const publicKeyFromDb = await this.firebaseService.getPublicKeyByHash(publicKeyHash);

			if (publicKeyFromDb.exists()) {
				const publicKey = await publicKeyFromDb.val();

				if (!publicKey.invoices.find((h) => h === publicKeyHash)) {
					this.firebaseService.setPublicKeyInvoicesByHash(publicKeyHash, [
						...publicKey.invoices,
						parsedInvoice.hash,
					]);
				}
			} else {
				this.firebaseService.setPublicKeyByHash(publicKeyHash, { invoices: [parsedInvoice.hash] });
			}
		}

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
			const publicOutputHash = encodeURIComponent(publicOutput);
			const publicKeyFromDb = await this.firebaseService.getPublicKeyByHash(publicOutputHash),
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
	}

	async subscribeDevice({ deviceToken }) {
		this.logger.debug(`subscribeDevice(subscriber: ${deviceToken})`);

		this.pushService.sendToDevice(deviceToken, {
			type: FirebaseMessageTypes.InvoicePending,
			invoice: 'invoice hash',
			amount: '50',
		});

		return { ok: true };
	}
}
