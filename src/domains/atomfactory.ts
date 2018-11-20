import Atom from './Atom';
import * as ids from './types';

export function createHelo(
  agent: string,
  osType: string,
  sessionId: ArrayBuffer,
  port: number,
  ping: number,
  version: number,
  bcId: ArrayBuffer,
) {
  return Atom.createParent(
    ids.HELO,
    [
      Atom.createStringContent(ids.HELO_AGENT, agent),
      Atom.createString4Content(ids.HELO_OSTYPE, osType),
      Atom.createContent(ids.HELO_SESSIONID, sessionId),
      Atom.createShortContent(ids.HELO_PORT, port),
      Atom.createShortContent(ids.HELO_PING, ping),
      Atom.createIntContent(ids.HELO_VERSION, version),
      Atom.createContent(ids.HELO_BCID, bcId),
    ],
  );
}

export function createOleh(
  agent: string,
  sessionId: ArrayBuffer,
  port: number,
  remoteIp: number,
  version: number,
) {
  return Atom.createParent(
    ids.OLEH,
    [
      Atom.createStringContent(ids.HELO_AGENT, agent),
      Atom.createContent(ids.HELO_SESSIONID, sessionId),
      Atom.createShortContent(ids.HELO_PORT, port),
      // atom.pushShortContent(HELO_PONG, pong);
      Atom.createIntContent(ids.HELO_REMOTEIP, remoteIp),
      Atom.createIntContent(ids.HELO_VERSION, version),
    ],
  );
}

export function createQuit() {
  return Atom.createIntContent(ids.QUIT, 0);
}
