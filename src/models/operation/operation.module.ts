import { Module, Logger } from '@nestjs/common';

import { DevToolModule } from 'src/models/devtool';
import { PushModule } from 'src/models/push';
import { FirebaseModule } from 'src/models/firebase';

import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';

@Module({
	imports: [DevToolModule, PushModule, FirebaseModule],
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
