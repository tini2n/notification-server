import { Module, Logger } from '@nestjs/common';

import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { DevToolModule } from 'src/models/devtool';

@Module({
	imports: [DevToolModule],
	providers: [
		OperationService,
		{
			provide: Logger,
			useValue: new Logger('OperationModule'),
		},
	],
	controllers: [OperationController],
	exports: [OperationService],
})
export class OperationModule {}
