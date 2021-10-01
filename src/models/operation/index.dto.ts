export interface CheckContractBody {
	contract: string;
}

export interface CheckContractResponse {
	ok: boolean;
	error?: string;
	inputsUsed?: boolean;
	outputsUsed?: boolean;
	parsedContract?: ParsedContract;
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
