import fs from "fs";
import { Masterchat, stringify } from "masterchat";
import path from "path";
import { stopwords } from "./stopwords";
import { WordNet } from "./wordnet";
import merge from "deepmerge";

interface Entry {
  meaning?: string;
  frequency: number;
}

const CACHE_DIR = path.join(path.dirname(__filename), "..", "cache");

function count(arr: string[]) {
  const res: Record<string, number> = {};
  for (const i of arr) {
    if (res[i]) {
      res[i] += 1;
    } else {
      res[i] = 1;
    }
  }
  return res;
}

function sort(obj: Object) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function sortObject(obj: Object) {
  return Object.fromEntries(
    Object.entries(obj).sort(
      (a: any, b: any) => b[1].frequency - a[1].frequency
    )
  );
}

async function fetchTranscript(id: string): Promise<string> {
  const mc = new Masterchat(id, "");
  const transcript = await mc.getTranscript();
  return transcript
    .map((e) => stringify(e.snippet))
    .join("\n")
    .replace(/\[(?:Tepuk tangan|Musik|Tertawa)\]/g, "")
    .replace(/[ ]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

async function getOrCreateTranscript(id: string) {
  const cachePath = path.join(CACHE_DIR, id + ".txt");
  try {
    return fs.readFileSync(cachePath, "utf-8");
  } catch (err) {
    const transcript = await fetchTranscript(id);
    fs.writeFileSync(cachePath, transcript);
    return transcript;
  }
}

function removeStopWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(/,/, ""))
    .filter((word) => !/^(\d+|.)$/.test(word))
    .filter((word) => !stopwords.includes(word));
}

function genBigram(arr: string[]) {
  return arr
    .reduce((sum, w) => {
      if (sum.length > 0) sum[sum.length - 1].push(w);
      sum.push([w]);
      return sum;
    }, [] as string[][])
    .map((pair) => pair.join(" "));
}

function generateBigram(corpus: string[]) {
  const bigram = genBigram(corpus);
  const bigramSortedByFreq = sort(count(bigram)).filter(
    (pair) => !/hai|ya|oke/.test(pair[0])
  );
  fs.writeFileSync(
    "bigram.csv",
    bigramSortedByFreq.map((pair) => pair.join(",")).join("\n") + "\n"
  );
  return bigram;
}

function generateVocab(corpus: string[]) {
  const vocab = sort(count(corpus));
  console.log(vocab.length, "words total");
  for (const [word, freq] of vocab.filter(([_, freq]) => freq > 100)) {
    console.log(word, "\t", freq);
  }
  fs.writeFileSync(
    "vocab.csv",
    vocab.map((pair) => pair.join(",")).join("\n") + "\n"
  );
  return vocab;
}

async function main() {
  const liveStreamIds = fs
    .readFileSync("./liveStreamIds.txt", "utf-8")
    .split("\n")
    .filter((l) => l);

  const transcripts = await Promise.all(
    liveStreamIds.map((id) => getOrCreateTranscript(id))
  );

  const raw = transcripts.join(" ");

  const corpus = removeStopWords(raw);

  generateBigram(corpus);
  const vocab = generateVocab(corpus);
  const dictFromVocab = Object.fromEntries(
    vocab.map(([word, freq]) => [word, { frequency: freq }])
  ) as Record<string, Entry>;

  const wn = await WordNet.init();

  function getMeaning(word: string) {
    const result = wn.query(word);
    const enWords = (result[0]?.englishWords as unknown as string | undefined)
      ?.split(", ")
      .map((word) => word.replace(/_/g, " "));
    return enWords?.join(", ");
  }

  const oldDict = JSON.parse(
    fs.readFileSync("./dictionary.json", "utf-8")
  ) as Record<string, Entry>;
  const dict = merge(oldDict, dictFromVocab) as Record<string, Entry>;

  for (const i in dict) {
    if (!dict[i].meaning) {
      dict[i].meaning = getMeaning(i) ?? "";
    }
  }

  const sortedDict = sortObject(dict);

  console.log(Object.entries(sortedDict).slice(0, 100));

  fs.writeFileSync("./dictionary.json", JSON.stringify(sortedDict, null, 2));
}

main();
