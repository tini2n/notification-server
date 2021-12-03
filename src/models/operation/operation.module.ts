import { Module, Logger } from '@nestjs/common';

import { PushModule } from 'src/models/push';
import { FirebaseModule } from 'src/models/firebase';
import { NetworkModule } from 'src/models/network';
import { StorageModule } from 'src/models/storage';

import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';

@Module({
	imports: [PushModule, FirebaseModule, NetworkModule, StorageModule],
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
