import { Controller, Body, Post } from '@nestjs/common';

import { OperationService } from './operation.service';
import { CheckContractBody, CheckContractResponse } from './index.dto';

@Controller('operation')
export class OperationController {
	constructor(private readonly operationService: OperationService) {}

	@Post('check/contract')
	async checkContract(@Body() body: CheckContractBody): Promise<CheckContractResponse> {
		// return this.operationService.getLog();

		// if (!this.operationService.sessionAvailable) return this.operationService.sessionUnavailableError;

		try {
			return this.operationService.checkContract(body.contract);
		} catch (e) {
			return { ok: false, error: JSON.stringify(e) };
		}
	}

	@Post('send/contract')
	sendContract(): string {
		console.log('send/contract');

		return 'send/contract';
	}

	@Post('sub/contracts')
	ensureContracts(): string {
		console.log('sub/contracts');

		return 'sub/contracts';
	}

	@Post('sub/invoices')
	registerInvoices(): string {
		console.log('sub/invoices');

		return 'sub/invoices';
	}
}
