import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import * as firebase from 'firebase-admin';

import { FB_REALTIME_DB, FIREBASE_CREDS_FILE } from 'src/common/constants';

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
	// databaseURL = process.env.NODE_ENV === 'production' ? FIREBASE_DB_URL_PROD : FIREBASE_DB_URL_DEV;
	databaseURL = FB_REALTIME_DB;

@Injectable()
export class FirebaseService {
	readonly firebaseApp = firebase.initializeApp({
		credential: firebaseCredential,
		databaseURL,
	});

	readonly db = this.firebaseApp.database();

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

	async setPublicKeyContractsByHash(hash: string, payload: Array<string>) {
		return await this.db.ref(`public-keys/${hash}/contracts`).set(payload);
	}

	async setPublicKeyByHash(hash: string, payload: { contracts?: Array<string>; invoices?: Array<string> }) {
		return await this.db.ref(`public-keys/${hash}`).set(payload);
	}

	async getPublicKeyByHash(hash: string) {
		return await this.db.ref(`public-keys/${hash}`).get();
	}

	async getContractByHash(hash: string) {
		// todo: refactor types
		return await this.db.ref(`contracts/${hash}`).get();
	}

	async setContractSubscribersByHash(hash: string, payload: Array<string>) {
		return await this.db.ref(`contracts/${hash}/subscribers`).set(payload);
	}

	async setContractByHash(hash: string, payload) {
		// todo: add model
		return await this.db.ref(`contracts/${hash}`).set(payload);
	}

	async getInvoiceByHash(hash: string) {
		return await this.db.ref(`invoices/${hash}`).get();
	}

	async setInvoiceSubscribersByHash(hash: string, payload: Array<string>) {
		return await this.db.ref(`invoices/${hash}/subscribers`).set(payload);
	}
}
