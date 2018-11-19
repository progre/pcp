import log4js = require('log4js');
import Atom from './Atom';
import { AtomContainerReader } from './AtomContainerReader';

const logger = log4js.getLogger();

export default class AtomReader {
  private name: string | null = null;
  private length!: number;
  private containerReader: AtomContainerReader | null = null;

  read(stream: NodeJS.ReadableStream) {
    if (this.name == null) {
      const headerBuffer = <Buffer>stream.read(8);
      if (headerBuffer == null) {
        return null;
      }
      this.name = headerBuffer.toString('ascii', 0, 4).replace(/\0/g, '');
      this.length = headerBuffer.readUInt32LE(4);
    }
    logger.debug(`Atom reading: ${this.name}`);
    if ((this.length & 0x80000000) !== 0) {
      if (this.containerReader == null) {
        this.containerReader = new AtomContainerReader(this.length & 0x7FFFFFFF);
      }
      const children = this.containerReader.read(stream);
      if (children == null) {
        logger.debug('no children.');
        return null;
      }
      const container = Atom.createParent(this.name, children);
      this.clear();
      return container;
    }
    let contentBuffer: Buffer | null;
    if (this.length === 0) {
      contentBuffer = null;
    } else {
      contentBuffer = <Buffer>stream.read(this.length);
      if (contentBuffer == null) {
        logger.debug(`no data: ${this.length}`);
        return null;
      }
    }
    const content = Atom.createContent(this.name, contentBuffer!);
    this.clear();
    return content;
  }

  clear() {
    this.name = null;
    this.length = 0;
    this.containerReader = null;
  }
}
