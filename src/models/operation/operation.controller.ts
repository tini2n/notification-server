import { Controller, Body, Post } from '@nestjs/common';

import { OperationService } from './operation.service';
import { EnsureContractsResponse, ParsedContract, CheckContractResponse, SendContractResponse } from './index.dto';

@Controller('operation')
export class OperationController {
	constructor(private readonly operationService: OperationService) {}

	@Post('check/contract')
	async checkContract(@Body() body: { contract: string }): Promise<CheckContractResponse> {
		const { contract } = body;
		// if (!this.operationService.sessionAvailable) return this.operationService.sessionUnavailableError;

		try {
			return await this.operationService.checkContract(contract);
		} catch (error) {
			return { ok: false, error: JSON.stringify(error) };
		}
	}

	@Post('send/contract')
	async sendContract(@Body() body: { contract: string; deviceToken: string }): Promise<SendContractResponse> {
		// if (!this.operationService.sessionAvailable) return this.operationService.sessionUnavailableError;

		try {
			return await this.operationService.sendContract(body);
		} catch (error) {
			return { ok: false, error: JSON.stringify(error) };
		}
	}

	@Post('sub/contracts')
	async ensureContracts(
		@Body() body: { contracts: string[]; deviceToken: string },
	): Promise<EnsureContractsResponse> {
		const { contracts = [], deviceToken = '' } = body;
		// if (!this.operationService.sessionAvailable) return this.operationService.sessionUnavailableError;

		try {
			const resolved: ParsedContract[] = [];

			for (let i = 0; i < contracts.length; i++) {
				const response = await this.operationService.ensureContractToken(contracts[i], deviceToken);
				if (response.resolved) resolved.push(response.resolved);
			}

			return { ok: true, resolved };
		} catch (e) {
			return { ok: false, error: JSON.stringify(e) };
		}
	}

	@Post('sub/invoices')
	async registerInvoices(@Body() body): Promise<any> {
		// if (!this.operationService.sessionAvailable) return this.operationService.sessionUnavailableError;

		try {
			const resolved = [];
			for (let i = 0; i < body.invoices.length; i++) {
				const response = await this.operationService.ensureInvoice(body.invoices[i], body.sub);
				if (response.resolved) resolved.push(response.resolved);
			}

			return { ok: true, resolved };
		} catch (e) {
			return { ok: false, error: JSON.stringify(e) };
		}
	}
}
