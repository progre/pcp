import assert from 'assert';
import log4js = require('log4js');
import net from 'net';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import Atom from '../domains/Atom';
import AtomReader from './AtomReader';

const logger = log4js.getLogger();

const pcpHeader = (() => {
  const name = 'pcp\n';
  const length = 4;
  const value = 1;
  const view = new DataView(new ArrayBuffer(12));
  [...Array(name.length).keys()]
    .map(i => name.charCodeAt(i))
    .forEach((x, i) => {
      view.setUint8(i, x);
    });
  view.setUint32(4, length, true);
  view.setUint32(8, value, true);
  return view.buffer;
})();

class Reader {
  private readedPCPHeader: boolean;
  private atomReader = new AtomReader();

  readonly onData = new Subject<Atom>();

  constructor(private socket: net.Socket, isServer: boolean) {
    this.readedPCPHeader = !isServer;
    socket.on('readable', () => {
      if (!this.readPCPHeaderIfNeeded()) {
        return;
      }
      for (; ;) {
        const atom = this.atomReader.read(socket);
        if (atom == null) {
          return;
        }
        this.onData.next(atom);
      }
    });
  }

  private readPCPHeaderIfNeeded() {
    if (this.readedPCPHeader) {
      return true;
    }
    const pcpHeaderBuf: Buffer = this.socket.read(pcpHeader.byteLength);
    if (pcpHeaderBuf == null) {
      return false;
    }
    if (!pcpHeaderBuf.equals(Buffer.from(pcpHeader))) {
      logger.info(`Socket destroyed: ${pcpHeaderBuf.slice(0, 4)}`);
      this.socket.destroy();
      return false;
    }
    this.readedPCPHeader = true;
    return true;
  }
}

class Writer {
  constructor(private socket: net.Socket, isServer: boolean) {
    if (!isServer) {
      Writer.writePCPHeader(this.socket);
    }
  }

  write(atom: Atom) {
    assert.equal(this.socket.destroyed, false);
    Writer.writeAtomRecursive(this.socket, atom);
  }

  private static writePCPHeader(stream: NodeJS.WritableStream) {
    stream.write(Buffer.from(pcpHeader));
  }

  private static writeAtomRecursive(stream: NodeJS.WritableStream, atom: Atom) {
    // logger.debug(`write: ${atom.name}`);
    stream.write(atom.name.padEnd(4, '\0'));
    const children = atom.children;
    if (children != null) {
      this.writeInt32LE(stream, 0x80000000 | children.length);
      children.forEach((child) => {
        this.writeAtomRecursive(stream, child);
      });
      return;
    }
    const content = atom.content!;
    this.writeInt32LE(stream, content.byteLength);
    stream.write(Buffer.from(content));
  }

  private static writeInt32LE(stream: NodeJS.WritableStream, value: number) {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(value, 0);
    stream.write(buffer);
  }
}

export default class PCPSocket {
  private reader: Reader;
  private writer: Writer;

  readonly onData: Observable<Atom>;

  constructor(socket: net.Socket, isServer: boolean) {
    this.reader = new Reader(socket, isServer);
    this.writer = new Writer(socket, isServer);
    this.onData = this.reader.onData
      .pipe(map((x) => { logger.debug(`read: ${x.toJSON()}`); return x; }));
  }

  write(atom: Atom) {
    logger.debug(`write: ${atom.toJSON()}`);
    this.writer.write(atom);
  }
}
