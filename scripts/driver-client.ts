import crypto from 'crypto';
import { getLogger } from 'log4js';
import net from 'net';
import seedrandom from 'seedrandom';
import PCPSocket from '../src/applications/PCPSocket';
import Atom from '../src/domains/Atom';
const { name, version } = require('../package.json');

const logger = getLogger();

const [major, minor, patch] = <number[]>version.split(',');
const versions = {
  agent: `${name}/${version}`,
  original: 1218,
  vp: 27,
  exPrefix: 'JS',
  exNumber: major * 0x0100 + minor,
};

async function main() {
  const host = process.argv[2].split(':');
  const hostname = host[0];
  const port = Number(host[1]) || 7144;
  const socket = net.connect(port, hostname, () => {
    const sid = generateId();
    const bcid = generateId();
    const pcpSocket = new PCPSocket(socket, false);
    pcpSocket.onData.subscribe((atom) => {
      if (atom.name === 'oleh') {
        const ipBuffer = atom.children!.filter(x => x.name === 'rip')[0].content!;
        const bcst = createBcst(sid, bcid, ipBuffer, port, 0x10);
        const quit = createQuit();
        pcpSocket.write(bcst);
        setTimeout(
          () => {
            pcpSocket.write(createBcst(sid, bcid, ipBuffer, port, 0x00));
            pcpSocket.write(quit);
          },
          180 * 1000,
        );
      }
    });
    pcpSocket.write(Atom.create([
      'helo', 'parent', [
        ['agnt', 'string', versions.agent],
        ['ver', 'int', versions.original],
        ['sid', 'bytes', sid],
        ['bcid', 'bytes', bcid],
        // ['port', 'short', 7144], // ポト0の場合は付けない
      ],
    ]));
  });
  socket.on('end', () => {
    logger.debug('end');
  });
  socket.on('close', () => {
    logger.debug('close');
  });
  socket.on('error', (err) => {
    logger.error(<any>err);
  });
  setInterval(
    () => {
      // NOP
    },
    10000,
  );
}

function createBcst(
  sid: ArrayBuffer,
  bcid: ArrayBuffer,
  ipBuffer: ArrayBuffer,
  port: number,
  flg1: number,
) {
  const channelName = 'test';
  const prng = seedrandom(`${Buffer.from(ipBuffer).toString('hex')}:${channelName}`);
  const array = new Int32Array(4);
  array[0] = prng.int32();
  array[1] = prng.int32();
  array[2] = prng.int32();
  array[3] = prng.int32();
  const cid = <ArrayBuffer>array.buffer;
  logger.debug(new Uint8Array(cid).toString());
  return Atom.create([
    'bcst', 'parent', [
      ['ttl', 'byte', 1],
      ['hops', 'byte', 0],
      ['from', 'bytes', sid],
      ['vers', 'int', versions.original],
      ['vrvp', 'int', versions.vp],
      ['vexp', 'string2', versions.exPrefix],
      ['vexn', 'short', versions.exNumber],
      ['cid', 'bytes', cid],
      ['grp', 'byte', 1],
      ['chan', 'parent', [
        ['id', 'bytes', cid],
        ['bcid', 'bytes', bcid],
        ['info', 'parent', [
          ['name', 'string', channelName],
          ['url', 'string', 'https://example.com'],
          ['gnre', 'string', ''],
          ['desc', 'string', ''],
          ['cmnt', 'string', ''],
          ['bitr', 'int', 0],
          ['type', 'string', 'RAW'],
          ['styp', 'string', ''],
          ['sext', 'string', ''],
        ]],
        ['trck', 'parent', [
          ['titl', 'string', ''],
          ['crea', 'string', ''],
          ['url', 'string', ''],
          ['albm', 'string', ''],
          ['gnre', 'string', ''],
        ]],
      ]],
      ['host', 'parent', [
        ['cid', 'bytes', cid],
        ['id', 'bytes', sid],
        ['ip', 'bytes', ipBuffer],
        ['port', 'short', port],
        ['numl', 'int', 0],
        ['numr', 'int', 0],
        ['uptm', 'int', 0],
        ['oldp', 'int', 0],
        ['newp', 'int', 0],
        ['ver', 'int', versions.original],
        ['vevp', 'int', versions.vp],
        ['vexp', 'string2', versions.exPrefix],
        ['vexn', 'short', versions.exNumber],
        ['flg1', 'byte', flg1],
      ]],
    ],
  ]);
}

function createQuit() {
  const PCP_ERROR_QUIT = 1000;
  return Atom.createIntContent('quit', PCP_ERROR_QUIT);
}

function generateId() {
  const b = crypto.randomBytes(16);
  return <ArrayBuffer>b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
}

main().catch((err: any) => process.stderr.write(`${err}\n`));
