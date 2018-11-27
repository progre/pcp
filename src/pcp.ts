import http from 'http';
import log4js from 'log4js';
import PCPSocket from './applications/PCPSocket';

const logger = log4js.getLogger();

export {
  PCPSocket,
};

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
          socket: new PCPSocket(res.socket, false),
        });
      }).end();
    } catch (e) {
      console.error(e.stack);
    }
  });
}
