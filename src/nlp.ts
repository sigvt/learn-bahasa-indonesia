import { count, sort } from "./utils";

export function genBigram(arr: string[]) {
  return arr
    .reduce((sum, w) => {
      if (sum.length > 0) sum[sum.length - 1].push(w);
      sum.push([w]);
      return sum;
    }, [] as string[][])
    .map((pair) => pair.join(" "));
}

export function generateVocab(corpus: string[]) {
  const vocab = sort(count(corpus));
  console.log(vocab.length, "words total");
  for (const [word, freq] of vocab.filter(([_, freq]) => freq > 100)) {
    console.log(word, "\t", freq);
  }
  return vocab;
}
