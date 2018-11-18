import events from 'events';
import http from 'http';
import log4js from 'log4js';
import net from 'net';
import stream from 'stream';
import PCPSocket from './pcpsocket';

const logger = log4js.getLogger();

class Server extends events.EventEmitter {
  private httpServer = http.createServer();

  constructor() {
    super();
    this.httpServer.on('connection', (socket: net.Socket) => {
      logger.debug(`connected: ${socket.remoteAddress}:${socket.remotePort}`);
      readablesify(socket);
      const onReadable = () => {
        logger.debug('readable');
        if (!isPCPHeader(<Buffer>socket.read(12))) {
          return;
        }
        socket.removeListener('readable', onReadable);
        super.emit('connection', new PCPSocket(socket));
      };
      socket.on('readable', onReadable);
    });
    this.httpServer.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
      logger.debug('request');
      super.emit('request', req, res, new PCPSocket(req.socket));
    });

    this.httpServer.on('listening', () => {
      super.emit('listening');
    });
  }

  listen(port: number, backlog?: number): Promise<{}>;
  listen(port: number, hostname: string, backlog: number): Promise<{}>;
  async listen(port: number, hostname: any, backlog?: any) {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(port, hostname, backlog, resolve);
    });
  }

  close() {
    this.httpServer.close();
  }
}

export function createServer() {
  return new Server();
}

export async function connectPCP(port: number, host?: string) {
  logger.info(`connecting... ${host}:${port}`);
  return new Promise<PCPSocket>((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      resolve(new PCPSocket(socket));
    });
  });
}

export async function requestHTTP(options: any) {
  return new Promise<{ statusCode: number; socket: PCPSocket }>((resolve, reject) => {
    if (options.headers == null) {
      options.headers = {};
    }
    options.headers['x-peercast-pcp'] = 1;
    // options.headers['x-peercast-pos'] = 0;
    // options.headers['x-peercast-port'] = 7145;
    try {
      http.request(options, (res) => {
        logger.debug('res');
        resolve({
          statusCode: res.statusCode!,
          socket: new PCPSocket(res.socket),
        });
      }).end();
    } catch (e) {
      console.error(e.stack);
    }
  });
}

function isPCPHeader(buffer: Buffer) {
  if (buffer == null) {
    return false;
  }
  if (buffer.slice(0, 4).toString('ascii') !== 'pcp\n') {
    return false;
  }
  if (buffer.readInt32LE(4) !== 4) {
    return false;
  }
  return true;
}

function readablesify(socket: net.Socket) {
  const cache = new stream.PassThrough();
  socket.on('data', (data: Buffer) => {
    cache.write(data);
    socket.emit('readable');
  });
  socket.read = (size?: number) => cache.read(size);
}
