import assert from 'assert';
import iconv from 'iconv-lite';

export default class Atom {
  static create(src: [string, string, any]) {
    const atom = this.createChildren([src]);
    assert.equal(atom.length, 1);
    return atom[0];
  }

  private static createChildren(src: ReadonlyArray<[string, string, any]>)
    : ReadonlyArray<Atom> {
    return src.map((item) => {
      const name = item[0];
      const type = item[1];
      const data = item[2];
      switch (type) {
        case 'parent':
          return Atom.createParent(name, this.createChildren(data));
        case 'byte':
          return Atom.createByteContent(name, data);
        case 'short':
          return Atom.createShortContent(name, data);
        case 'int':
          return Atom.createIntContent(name, data);
        case 'string':
          return Atom.createStringContent(name, data);
        case 'string2':
          return Atom.createString2Content(name, data);
        case 'url':
          return Atom.createURLContent(name, data);
        case 'bytes':
          return Atom.createContent(name, data);
        default:
          throw new Error();
      }
    });
  }

  static createContent(name: string, content: ArrayBuffer) {
    return new Atom(name, content, null);
  }

  static createByteContent(name: string, content: number) {
    const buffer = new ArrayBuffer(1);
    new DataView(buffer).setUint8(0, content);
    return Atom.createContent(name, buffer);
  }

  static createShortContent(name: string, content: number) {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint16(0, content, true);
    return Atom.createContent(name, buffer);
  }

  static createIntContent(name: string, content: number) {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, content, true);
    return Atom.createContent(name, buffer);
  }

  static createStringContent(name: string, content: string) {
    return Atom.createContent(name, toArrayBuffer(Buffer.from(`${content}\0`)));
  }

  static createString2Content(name: string, content: string) {
    assert.equal(content.length, 2);
    return Atom.createContent(name, toArrayBuffer(Buffer.from(content)));
  }

  static createURLContent(name: string, content: string) {
    return Atom.createContent(name, toArrayBuffer(Buffer.from(content)));
  }

  static createParent(name: string, children: ReadonlyArray<Atom>) {
    return new Atom(name, null, children);
  }

  private constructor(
    public readonly name: string,
    public readonly content: ArrayBuffer | null,
    public readonly children: ReadonlyArray<Atom> | null,
  ) {
  }

  toJSON() {
    return `{${this.toJSONRecursive()}}`;
  }

  private toJSONRecursive(): string {
    if (this.content != null) {
      return `"${this.name}":${toString(this.name, this.content)}`;
    }
    return `"${this.name}":{${this.children!.map(x => x.toJSONRecursive()).join(',')}}`;
  }
}

function toArrayBuffer(b: Buffer) {
  return <ArrayBuffer>b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
}

function toString(name: string, content: ArrayBuffer) {
  if (['port', 'vexn'].includes(name)) {
    assert.equal(content.byteLength, 2, `Invalid byteLength: ${name}`);
    return String(new DataView(content).getInt16(0, true));
  }
  if ((
    [
      'bitr',
      'newp',
      'numl',
      'numr',
      'oldp',
      'quit',
      'uptm',
      'ver',
      'vers',
      'vevp',
      'vrvp',
    ].includes(name)
  )) {
    assert.equal(content.byteLength, 4);
    return String(new DataView(content).getInt32(0, true));
  }
  if ((
    [
      'agnt',
      'albm',
      'cmnt',
      'crea',
      'desc',
      'gnre',
      'name',
      'sext',
      'styp',
      'titl',
      'type',
      'url',
      'vexp',
    ].includes(name)
  )) {
    const hasNullStr = new Uint8Array(content)[content.byteLength - 1] === 0;
    return `"${iconv.decode(Buffer.from(content), 'utf8')}${hasNullStr ? '(\\0)' : ''}"`;
  }
  if (['ip', 'rip'].includes(name)) {
    const array = new Uint8Array(content);
    return `"${array.reverse().join('.')}"`;
  }
  return `"${[...new Uint8Array(content)]
    .map(x => Number(x).toString(16).padStart(2, '0'))
    .join('')}"`;
}
