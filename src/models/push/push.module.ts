import { Module, Logger } from '@nestjs/common';

import { FirebaseModule } from 'src/models/firebase';

import { PushService } from './push.service';

@Module({
	imports: [FirebaseModule],
	controllers: [],
	providers: [
		PushService,
		{
			provide: Logger,
			useValue: new Logger('PushModule'),
		},
	],
	exports: [PushService],
})
export class PushModule {}
