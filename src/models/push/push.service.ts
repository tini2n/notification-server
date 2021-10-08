import { Injectable } from '@nestjs/common';

import { FirebaseService, FirebaseDataMessagePayload, FirebaseMessageTypes } from 'src/models/firebase';

@Injectable()
export class PushService {
	constructor(private readonly firebaseService: FirebaseService) {}

	async sendToDevice(deviceToken: string, data: FirebaseDataMessagePayload) {
		const notification = {
			title: '',
			body: `Open the wallet to see more...`, // todo: bank of strings
		};

		switch (data.type) {
			case FirebaseMessageTypes.InvoicePending:
				notification.title = `${data['amount']} tagions sent to you`;
				break;
			case FirebaseMessageTypes.InvoiceResolved:
				notification.title = `You received tagions`;
				break;
			case FirebaseMessageTypes.ContractResolved:
				notification.title = `Transaction Complete`;
				break;

			default:
				notification.title = 'Check this out!';
				break;
		}

		return await this.firebaseService.sendMessageToDevice(deviceToken, { notification, data });
	}
}
