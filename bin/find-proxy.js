import arp from '@network-utils/arp-lookup';
import { download2 } from '../lib/download.js';

const a = await arp.getTable();
const possible = a.map(val => `http://${val.ip}:9090/ui/c/index.txt`);

async function main() {

    const text = await download2(possible, false)
    console.log(text)
}

main()

