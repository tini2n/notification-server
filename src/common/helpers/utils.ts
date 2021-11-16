import { exec } from 'child_process';
import * as crypto from 'crypto';

export const execPromise = async (command: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(stderr);
				throw new Error(JSON.stringify(error));
			}

			resolve(stdout);
		});
	});
};

export  const calcHash = (value: Buffer) => {
   const shasum = crypto.createHash('sha1');

   shasum.update(value);

   return shasum.digest('hex');
}