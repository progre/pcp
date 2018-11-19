import log4js from 'log4js';
import Atom from './Atom';

const logger = log4js.getLogger();

export function write(stream: NodeJS.WritableStream, atom: Atom) {
  logger.debug(`Atom writing: ${atom.name}`);
  stream.write(atom.name.padEnd(4, '\0'));
  const children = atom.children;
  if (children != null) {
    writeInt32LE(stream, 0x80000000 | children.length);
    children.forEach((child) => {
      write(stream, child);
    });
    return;
  }
  const content = atom.content!;
  writeInt32LE(stream, content.length);
  stream.write(content);
}

function writeInt32LE(stream: NodeJS.WritableStream, value: number) {
  const buffer = new Buffer(4);
  buffer.writeInt32LE(value, 0);
  stream.write(buffer);
}
