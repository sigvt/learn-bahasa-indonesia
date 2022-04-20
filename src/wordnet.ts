import dict from "id-en-dictionary";
import Dictionary from "id-en-dictionary/dist/dictionary";

export class WordNet {
  private d: Dictionary;

  static async init() {
    const d = await dict.init();
    const wn = new WordNet(d);
    return wn;
  }

  constructor(d: Dictionary) {
    this.d = d;
  }

  query(word: string) {
    const result = Array.from(this.d.query(word).values());
    return result;
  }
}
