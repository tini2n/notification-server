export interface CheckContractResponse {
	ok: boolean;
	error?: string;
	inputsUsed?: boolean;
	outputsUsed?: boolean;
	parsedContract?: ParsedContract;
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
	subs: string[];
	expiration: string;
}

export interface ParsedContract {
	hash: string;
	contract: string;
	amount: number;
	in: string[];
	out: string[];
}

export interface ParsedInvoice {
	hash: string;
	invoice: string;
	keys: string[];
}
