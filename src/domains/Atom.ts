export default class Atom {
  static createContent(name: string, content: Buffer) {
    return new Atom(name, content, null);
  }

  static createByteContent(name: string, content: number) {
    const buffer = new Buffer(1);
    buffer.writeUInt8(content, 0);
    return Atom.createContent(name, buffer);
  }

  static createShortContent(name: string, content: number) {
    const buffer = new Buffer(2);
    buffer.writeUInt16LE(content, 0);
    return Atom.createContent(name, buffer);
  }

  static createIntContent(name: string, content: number) {
    const buffer = new Buffer(4);
    buffer.writeUInt32LE(content, 0);
    return Atom.createContent(name, buffer);
  }

  static createStringContent(name: string, content: string) {
    return Atom.createContent(name, new Buffer(content));
  }

  static createString4Content(name: string, content: string) {
    const str = new Buffer(content, 'ascii');
    if (str.length !== 4) {
      throw new Error('Content length must be 4.');
    }
    return Atom.createContent(name, str);
  }

  static createParent(name: string, children: ReadonlyArray<Atom>) {
    return new Atom(name, null, children);
  }

  private constructor(
    public readonly name: string,
    public readonly content: Buffer | null,
    public readonly children: ReadonlyArray<Atom> | null,
  ) {
  }
}
