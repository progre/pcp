import events from 'events';
import log4js from 'log4js';
import net from 'net';
import Atom from './domains/Atom';
import AtomReader from './domains/AtomReader';
import * as pcpAtom from './domains/pcpatom';

const AGENT_NAME = 'node-peercast';
const logger = log4js.getLogger();

export default class PCPSocket extends events.EventEmitter {
  private reader = new AtomReader();

  constructor(private socket: net.Socket) {
    super();
    const localRemote = this.localRemote;
    socket.on('close', () => {
      logger.info(`Closed: ${localRemote}`);
      this.socket = <any>null;
      this.emit('close');
    });
    socket.on('end', () => {
      logger.info(`EOS: ${localRemote},${this.socket.read()}`);
    });
    socket.on('readable', () => {
      logger.info(`Incoming message: ${localRemote}`);
      for (; ;) {
        const atom = this.reader.read(socket);
        if (atom == null) {
          logger.debug('wait');
          return;
        }
        logger.info(`Atom received: ${atom.name}`);
        super.emit(pcpAtom.toName(atom.name), atom);
      }
    });
    logger.info(`Connected: ${localRemote}`);
  }

  hello(agentName: string, port: number) {
    logger.info(`Send hello: ${this.localRemote}`);
    write(this.socket, pcpAtom.createHello(
      agentName,
      '\0\0\0\0',
      createSessionId(),
      port,
      port,
      1218, // TODO: 何でこのバージョン？
      new Buffer(16)));
  }

  olleh() {
    logger.info(`Send olleh: ${this.localRemote}`);
    const sessionId = new Buffer(16);
    sessionId.fill(0);
    write(this.socket, pcpAtom.createOlleh(
      AGENT_NAME,
      sessionId,
      0,
      0,
      0));
  }

  quit() {
    logger.info(`Send quit: ${this.localRemote}`);
    write(this.socket, pcpAtom.createQuit());
  }

  end() {
    this.socket.end();
  }

  private get localRemote() {
    return `${this.socket.localAddress}:${this.socket.localPort}, `
      + `${this.socket.remoteAddress}:${this.socket.remotePort}`;
  }
}

function write(stream: NodeJS.WritableStream, atom: Atom) {
  if (atom.name.length !== 4) {
    throw new Error(`Invalid name: ${atom.name}`);
  }
  logger.debug(`Atom writing: ${atom.name}`);
  stream.write(atom.name);
  if (atom.isContainer()) {
    writeInt32LE(stream, 0x80000000 | atom.children.length);
    atom.children.forEach((child) => {
      write(stream, child);
    });
  } else {
    writeInt32LE(stream, atom.content.length);
    stream.write(atom.content);
  }
}

function writeInt32LE(stream: NodeJS.WritableStream, value: number) {
  const buffer = new Buffer(4);
  buffer.writeInt32LE(value, 0);
  stream.write(buffer);
}

function createSessionId() {
  const sessionId = new Buffer(16);
  for (let i = 0; i < sessionId.length; i += 1) {
    sessionId.writeUInt8(Math.floor(Math.random() * 256), i);
  }
  return sessionId;
}
