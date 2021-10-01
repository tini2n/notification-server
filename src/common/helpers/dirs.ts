import * as fs from 'fs';
import * as path from 'path'

export function ensureDir(dirPath: string) {
    fs.mkdirSync(dirPath, { recursive: true });
}

export function resolvePersistent(dir: string) {
    return path.resolve(__dirname, '../../', 'tagion_devtool_bin', 'PersistedNetworkData', 'General', dir)
}

export function resolvePersistentContainer(dir: string) {
    return path.normalize(`/mnt/general/shared/${dir}`);
}

export function resolvePersistentSession(session: string, dir: string) {
    return path.resolve(__dirname, '../../', 'tagion_devtool_bin', 'PersistedNetworkData', 'Sessions', session, dir)
}

export function resolvePersistentContainerSession(dir: string) {
    return path.normalize(`/mnt/shared/${dir}`);
}

export function resolvePath(isContainer: boolean, session: string, ...pathParts: string[]) {
    let persistentPath = isContainer ? '/mnt/general/shared/' : `${__dirname}/../../tagion_devtool_bin/PersistedNetworkData/General`;

    if (session?.toLocaleLowerCase() !== 'general') {
        persistentPath = isContainer ? '/mnt/shared/' : `${__dirname}/../../tagion_devtool_bin/PersistedNetworkData/Sessions/${session}`;
    }

    return path.resolve(persistentPath, ...pathParts);
}

export function fileWallet(prepend: string) {
    return path.normalize(`${prepend}/tagionwallet.hibon`);
}
export function fileInvoice(prepend: string) {
    return path.normalize(`${prepend}/invoice.hibon`);
}
export function fileContract(prepend: string) {
    return path.normalize(`${prepend}/contract.hibon`);
}
export function fileAccount(prepend: string) {
    return path.normalize(`${prepend}/accounts.hibon`);
}
export function fileBills(prepend: string) {
    return path.normalize(`${prepend}/bills.hibon`);
}
export function fileDart(prepend: string) {
    return path.normalize(`${prepend}/dart.drt`);
}

export function fileTemp(prepend: string, name: string) {
    return path.normalize(`${prepend}/${name}`);
}