import { Injectable } from '@nestjs/common';

import { FirebaseService } from 'src/models/firebase';

@Injectable()
export class StorageService {
	constructor(private readonly firebaseService: FirebaseService) {}

	public async withPublicKey(publicKey: string) {
		const encodedKey = encodeURIComponent(publicKey);

		const publicKeyFromDB = await this.firebaseService.getPublicKeyByHash(encodedKey),
			exist = publicKeyFromDB.exists();

		return {
			exist,
			entity: { ...(publicKeyFromDB.exists() && (await publicKeyFromDB.val())) },
		};
	}

	public async withContract(contractHash: string) {
		const encodedContractHash = encodeURIComponent(contractHash);

		const contractFromDb = await this.firebaseService.getContractByHash(encodedContractHash),
			exist = contractFromDb.exists();

		return {
			exist,
			entity: { ...(contractFromDb.exists() && (await contractFromDb.val())) },
		};
	}
}
