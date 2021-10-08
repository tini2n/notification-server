export interface FirebaseContractPayload {
	sessionId: string;
	hash: string;
}

export interface FirebaseInvoicePayload extends FirebaseContractPayload {}

export interface FirebaseNotification {
	[key: string]: string | undefined;
}

export interface FirebaseMessagingPayload {
	notification: FirebaseNotification;
	data: FirebaseDataMessagePayload;
}

export interface FirebaseDataMessagePayload extends FirebaseNotification {
	type: FirebaseMessageTypes;
}

export enum FirebaseMessageTypes {
	InvoicePending = 'InvoicePending',
	InvoiceResolved = 'InvoiceResolved',
	ContractResolved = 'ContractResolved',
	Default = 'Default',
}
