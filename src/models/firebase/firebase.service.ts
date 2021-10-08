import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import * as firebase from 'firebase-admin';

import { FIREBASE_DB_URL_DEV, FIREBASE_DB_URL_PROD, FIREBASE_CREDS_FILE } from 'src/common/constants';

import {
	FirebaseContractPayload,
	FirebaseInvoicePayload,
	FirebaseDataMessagePayload,
	FirebaseNotification,
	FirebaseMessageTypes,
} from './index.dto';

const serviceAccountCredentials = JSON.parse(
		fs.readFileSync(FIREBASE_CREDS_FILE).toString(), // INFO: Download firebase credentials (ask admin)
	),
	firebaseCredential = firebase.credential.cert(serviceAccountCredentials),
	databaseURL = process.env.NODE_ENV === 'production' ? FIREBASE_DB_URL_PROD : FIREBASE_DB_URL_DEV;

@Injectable()
export class FirebaseService {
	readonly firebaseApp = firebase.initializeApp({
		credential: firebaseCredential,
		databaseURL,
	});

	async sendMessageToDevice(
		token: string,
		{
			notification = {},
			data = { type: FirebaseMessageTypes.Default },
		}: {
			notification: FirebaseNotification;
			data: FirebaseDataMessagePayload;
		},
	) {
		return await firebase.messaging(this.firebaseApp).sendToDevice(token, {
			notification,
			data,
		});
	}

	async getContractByHash({ sessionId, hash }: FirebaseContractPayload) {
		// todo: refactor types
		return this.firebaseApp.database().ref(`${sessionId}/contracts/${hash}`).get();
	}

	async getInvoiceByHash({ sessionId, hash }: FirebaseInvoicePayload) {
		return this.firebaseApp.database().ref(`${sessionId}/invoices/${hash}`).get();
	}
}
