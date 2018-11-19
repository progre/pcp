import http from 'http';
import log4js from 'log4js';
import net from 'net';
import PCPSocket from './pcpsocket';
import Server from './Server';

export const logger = log4js.getLogger();

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

export async function requestHTTP(options: http.RequestOptions) {
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
