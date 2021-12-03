import { Module, Logger } from '@nestjs/common';

import { NetworkService } from './network.service';

@Module({
	imports: [],
	controllers: [],
	providers: [
		NetworkService,
		{
			provide: Logger,
			useValue: new Logger('NetworkModule'),
		},
	],
	exports: [NetworkService],
})
export class NetworkModule {}
