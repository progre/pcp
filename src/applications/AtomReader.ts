import Atom from '../domains/Atom';

interface ContentHeader {
  name: string;
  contentLength: number;
}

interface ParentHeader {
  name: string;
  childrenCount: number;
}

type Header = ContentHeader | ParentHeader;

export default class AtomReader {
  private currentAtomHeader: Header | null = null;
  private childrenReader: AtomReader | null = null;
  private children: Atom[] = [];

  read(stream: NodeJS.ReadableStream): Atom | null {
    if (this.currentAtomHeader == null) {
      const header = readHeader(stream);
      if (header == null) {
        return null;
      }
      this.currentAtomHeader = header;
      this.childrenReader = new AtomReader();
    }
    const atom = readData(
      stream,
      this.childrenReader!,
      this.children,
      this.currentAtomHeader,
    );
    if (atom == null) {
      return null;
    }
    this.clear();
    return atom;
  }

  private clear() {
    this.currentAtomHeader = null;
    this.childrenReader = null;
    this.children = [];
  }
}

function readHeader(stream: NodeJS.ReadableStream): Header | null {
  const buf = <Buffer>stream.read(8);
  if (buf == null) {
    return null;
  }
  const length = buf.readUInt32LE(4);
  const isParent = (length & 0x80000000) !== 0;
  if (isParent) {
    return {
      name: buf.toString('ascii', 0, 4).replace(/\0/g, ''),
      childrenCount: length & 0x7FFFFFFF,
    };
  }
  return {
    name: buf.toString('ascii', 0, 4).replace(/\0/g, ''),
    contentLength: length,
  };
}

function readData(
  stream: NodeJS.ReadableStream,
  childrenReader: AtomReader,
  children: Atom[],
  header: Header,
) {
  if ('childrenCount' in header) {
    const parentAtom = readChildren(
      stream,
      childrenReader,
      children,
      header,
    );
    if (parentAtom == null) {
      return null;
    }
    return parentAtom;
  }
  const contentAtom = readContent(
    stream,
    header.name,
    header.contentLength,
  );
  if (contentAtom == null) {
    return null;
  }
  return contentAtom;
}

function readChildren(
  stream: NodeJS.ReadableStream,
  reader: AtomReader,
  children: Atom[],
  header: ParentHeader,
) {
  for (; ;) {
    const childAtom = reader.read(stream);
    if (childAtom == null) {
      return null;
    }
    children.push(childAtom);
    if (children.length >= header.childrenCount) {
      break;
    }
  }
  return Atom.createParent(header.name, children);
}

function readContent(
  stream: NodeJS.ReadableStream,
  name: string,
  length: number,
) {
  const buf = <Buffer>stream.read(length);
  if (buf == null) {
    return null;
  }
  const array = new Uint8Array(buf.length);
  buf.copy(array);
  return Atom.createContent(name, <ArrayBuffer>array.buffer);
}
