import Atom from './Atom';
import AtomReader from './AtomReader';

export class AtomContainerReader {
  private reader!: AtomReader;
  private children: Atom[] = [];

  constructor(private length: number) {
  }

  read(stream: NodeJS.ReadableStream) {
    for (; ;) {
      if (this.reader == null) {
        this.reader = new AtomReader();
      }
      const atom = this.reader.read(stream);
      if (atom == null) {
        return null;
      }
      this.children.push(atom);
      if (this.children.length >= this.length) {
        return this.children;
      }
    }
  }
}
