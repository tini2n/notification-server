import { Injectable } from '@nestjs/common';

import { FirebaseService } from 'src/models/firebase';

import { Contract } from '../hibon';

@Injectable()
export class StorageService {
	constructor(private readonly firebaseService: FirebaseService) {}

	public async getPublicKey(publicKey: string) {
		const encodedKey = encodeURIComponent(publicKey);

		const publicKeyFromDB = await this.firebaseService.getPublicKeyByHash(encodedKey),
			exist = publicKeyFromDB.exists();

		return {
			exist,
			entity: { ...(publicKeyFromDB.exists() && (await publicKeyFromDB.val())) },
		};
	}

	public async getContract(contractHash: string) {
		const encodedContractHash = encodeURIComponent(contractHash);

		const contractFromDb = await this.firebaseService.getContractByHash(encodedContractHash),
			exist = contractFromDb.exists();

		return {
			exist,
			entity: { ...(contractFromDb.exists() && (await contractFromDb.val())) },
		};
	}

	public async publicKeyWithContract(publicKey: string): Promise<boolean> {
		const { exist: isPublicKeyExist, entity: publicKeyEntity = { contracts: [] } } = await this.getPublicKey(
			publicKey,
		);

		if (isPublicKeyExist) {
			for (let contractHash of publicKeyEntity.contracts) {
				const { entity: contractEntity = { contract: null } } = await this.getContract(contractHash);

				return !!contractEntity.contract;
			}
		}

		return false;
	}

	public async addContractSubscriber(
		contractHash: string,
		deviceToken: string,
	): Promise<{ ok: boolean; existedBefore?: boolean; resolved?: Contract }> {
		const { exist: isContractExist, entity: contractEntity } = await this.getContract(contractHash);

		if (isContractExist) {
			if (!contractEntity.subscribers.find((d) => d === deviceToken)) {
				await this.firebaseService.setContractSubscribersByHash(contractHash, [
					...contractEntity.subscribers,
					deviceToken,
				]);

				return { ok: true, existedBefore: true };
			}
			
			return { ok: true, existedBefore: false, resolved: { contract: contractHash, ...contractEntity } };
		}
	}

	public async addContract(contractHash: string, payload) {
		this.firebaseService.setContractByHash(contractHash, payload);
	}

	public async addPublicKeyContract(publicKey: string, contractHash: string) {
		const { exist: isPublicKeyExist, entity: publicKeyEntity } = await this.getPublicKey(publicKey);

		if (isPublicKeyExist) {
			if (!publicKeyEntity.contracts.find((h) => h === contractHash)) {
				await this.firebaseService.setPublicKeyContractsByHash(publicKey, [
					...publicKeyEntity.contracts,
					contractHash,
				]);
			}
		} else {
			await this.firebaseService.setPublicKeyByHash(publicKey, { contracts: [contractHash] });
		}
	}
}
