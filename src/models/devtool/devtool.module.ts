import { Logger, Module } from '@nestjs/common';
import { DevToolService } from './devtool.service';

@Module({
	providers: [
		DevToolService,
		{
			provide: Logger,
			useValue: new Logger('DevToolModule'),
		},
	],
	exports: [DevToolService],
})
export class DevToolModule {}
