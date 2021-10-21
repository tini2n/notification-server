import { exec } from 'child_process';

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
