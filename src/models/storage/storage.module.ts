import { Module } from '@nestjs/common';

import { FirebaseModule } from 'src/models/firebase';
import { StorageService } from './storage.service';

@Module({
	imports: [FirebaseModule],
	controllers: [],
	providers: [StorageService],
	exports: [StorageService],
})
export class StorageModule {}
