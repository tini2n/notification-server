export const APP_ROOT = process.cwd();

export const FB_REALTIME_DB = 'https://preconfirmation-server-default-rtdb.europe-west1.firebasedatabase.app/'; //todo: move to envs
export const FIREBASE_DB_URL_PROD = 'https://project-just-282008.firebaseio.com'; //todo: move to envs
export const FIREBASE_DB_URL_DEV = 'https://project-just-dev.firebaseio.com'; //todo: move to envs
export const FIREBASE_CREDS_FILE = 'firebase.json';

export const TAGION_NETWORK_CREDS = {
	sslKey: 'alice.key',
	sslCert: 'alice.pem',
	sslCA: 'ca.pem',
	url: '127.0.0.1',
	port: 5000,
};

export * from './mocks';
