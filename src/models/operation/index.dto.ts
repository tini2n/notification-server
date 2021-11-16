import { Contract, HiBON } from 'src/models/hibon';

export interface CheckContractResponse {
	ok: boolean;
	error?: string;
	inputsUsed?: boolean;
	outputsUsed?: boolean;
	parsedContract?: Contract;
}

export interface SendContractResponse {
	ok: boolean;
	error?: string;
	existedBefore?: boolean;
	resolved?: ParsedContract;
}

export interface EnsureContractsResponse {
	ok: boolean;
	error?: string;
	existedBefore?: boolean;
	resolved?: ParsedContract[];
}

export interface PushSub {
	hash: string;
	invoice?: string;
	contract?: string;
	keys: string[];
	in?: string[];
	out?: string[];
	subscribers: string[];
	expiration: string;
}

export interface ParsedContract {
	hash: string;
	contract: string;
	amount?: number;
	in: string[];
	out: string[];
}

export interface ParsedInvoice {
	hash: string;
	invoice: string;
	keys: string[];
}
