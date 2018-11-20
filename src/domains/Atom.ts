export default class Atom {
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
    return Atom.createContent(name, <ArrayBuffer>Buffer.from(content).buffer);
  }

  static createString4Content(name: string, content: string) {
    const str = Buffer.from(content, 'ascii');
    if (str.length !== 4) {
      throw new Error('Content length must be 4.');
    }
    return Atom.createContent(name, <ArrayBuffer>str.buffer);
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
}
