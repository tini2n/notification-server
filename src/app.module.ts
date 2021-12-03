import { StorageModule } from './models/storage/storage.module';
import { NetworkModule } from './models/network/network.module';
import { HibonModule } from './models/hibon/hibon.module';
import { FirebaseModule } from './models/firebase/firebase.module';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { OperationModule } from './models/operation';
import { PushModule } from './models/push';

import config from './config';

@Module({
	imports: [
		StorageModule,
		NetworkModule,
		ConfigModule.forRoot({
			load: [config],
			envFilePath: '.development.env',
			ignoreEnvFile: process.env.NODE_ENV === 'production',
			isGlobal: true,
		}),
		HibonModule,
		OperationModule,
		PushModule,
		FirebaseModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
