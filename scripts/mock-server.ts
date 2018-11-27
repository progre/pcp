import crypto from 'crypto';
import { getLogger } from 'log4js';
import net from 'net';
import PCPSocket from '../src/applications/PCPSocket';
import Atom from '../src/domains/Atom';

const logger = getLogger();

async function main() {
  const port = process.argv[2];
  net.createServer((socket) => {
    logger.debug(`connect: ${socket.remoteAddress}:${socket.remotePort} ${socket.remoteFamily}`);
    const pcpSocket = new PCPSocket(socket, true);
    pcpSocket.onData.subscribe((atom) => {
      if (atom.name === 'helo') {
        if (atom.children == null) {
          logger.info('Invalid atom');
          socket.destroy();
          return;
        }
        if (socket.remoteFamily !== 'IPv4' && socket.remoteAddress !== '::ffff:127.0.0.1') {
          logger.info(`Invalid remoteFamily: ${socket.remoteFamily}`);
          socket.destroy();
          return;
        }
        logger.debug(socket.remoteAddress!);
        const portBuffer = atom.children
          .filter(x => x.name === 'port')
          .map(x => x.content)[0];
        const children = [
          ['agnt', 'string', 'PeerCast/0.1218'],
          ['sid', 'string', generateId()],
          ['ver', 'int', 1218],
          ['rip', 'bytes', <ArrayBuffer>new Uint8Array([192, 168, 0, 6].reverse()).buffer],
        ];
        if (portBuffer != null) {
          children.push(['port', 'short', portBuffer]);
        }
        pcpSocket.write(Atom.create(['oleh', 'parent', children]));
        return;
      }
      if (atom.name === 'quit') {
        pcpSocket.write(Atom.create(
          ['root', 'parent', [
            ['upd', 'parent', [
              ['quit', 'int', 2000],
            ]],
          ]],
        ));
      }
    });
  }).listen(port);
}

function generateId() {
  const b = crypto.randomBytes(16);
  return <ArrayBuffer>b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
}

main().catch((err: any) => process.stderr.write(`${err}\n`));
