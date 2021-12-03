import { Injectable, Logger } from '@nestjs/common';

import * as tls from 'tls';
import * as fs from 'fs';
import * as path from 'path';

import { APP_ROOT, TAGION_NETWORK_CREDS } from 'src/common/constants';

const { sslKey, sslCert, sslCA } = TAGION_NETWORK_CREDS;

const sslOptions = {
	key: fs.readFileSync(path.resolve(APP_ROOT, sslKey), 'utf8').replace(/\\n/gm, '\n'),
	cert: fs.readFileSync(path.resolve(APP_ROOT, sslCert), 'utf8').replace(/\\n/gm, '\n'),
	ca: fs.readFileSync(path.resolve(APP_ROOT, sslCA), 'utf8').replace(/\\n/gm, '\n'),
};

@Injectable()
export class NetworkService {
	constructor(private readonly logger: Logger) {}

	public sendHiRPC(buffer: Buffer) {
		const { url, port } = TAGION_NETWORK_CREDS;

		return new Promise((resolve, reject) => {
			this.logger.debug(`Sending HiRPC...`);
			const connection = tls.connect(port, url, sslOptions, () => {
				const wrote = connection.write(buffer);
				this.logger.debug(`Sent HiRPC: ${wrote}`);
			});

			connection.on('data', (data) => {
				this.logger.debug(`Received HiRPC response: ${data?.toString()}`);
				connection.end();
				resolve(data);
			});

			connection.on('error', (error) => {
				this.logger.debug(`Received HiRPC error: ${JSON.stringify(error)}`);
				reject(`Error: ${JSON.stringify(error)}`);
			});
		});
	}
}
