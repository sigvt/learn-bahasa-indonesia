import csv from "async-csv";
import axios from "axios";
import merge from "deepmerge";
import fs from "fs";
import JSON5 from "json5";
import { stringify } from "masterchat";
import { dirname, join } from "path";
import { genBigram, generateVocab } from "./nlp";
import { removeStopWords } from "./stopwords";
import { getOrCreateTranscript, stringifyTranscript } from "./transcript";
import { arrayToObject, count, filterObject, sort, sortObject } from "./utils";
import { WordNet } from "./wordnet";

const CACHE_DIR = join(dirname(__filename), "..", "cache");
const DATA_DIR = join(dirname(__filename), "..", "data");
const STREAMS_DIR = join(DATA_DIR, "streams");
const DIST_DIR = join(dirname(__filename), "..", "build");

async function fetchStreams(channelId: string): Promise<Stream[]> {
  const res = await axios.get<HolodexStream[]>(
    `https://holodex.net/api/v2/channels/${channelId}/videos`,
    {
      params: {
        type: "stream",
        status: "past",
        limit: 100,
      },
    }
  );

  const streams = res.data.map((info) => {
    return {
      id: info.id,
      title: info.title,
      created: info.published_at,
    };
  });

  return streams;
}

async function loadTranscripts(indexFiles: string[]) {
  const transcripts = [];

  for (const indexFile of indexFiles) {
    console.log("opening", indexFile);
    const index = JSON5.parse(fs.readFileSync(indexFile, "utf-8")) as Stream[];

    for (const i in index) {
      if (index[i].available === false) {
        continue;
      }
      console.log("loading", index[i].id);

      const transcript = await getOrCreateTranscript(index[i].id, CACHE_DIR);
      if (!transcript) {
        console.log("unavailable", index[i].id);
        index[i].available = false;
        fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
        continue;
      }

      transcripts.push({ id: index[i].id, transcript });
    }
  }

  return transcripts;
}

async function main() {
  const people = JSON.parse(
    fs.readFileSync(join(DATA_DIR, "people.json"), "utf-8")
  ) as Person[];

  for (const person of people) {
    console.log("refreshing", person.name, person.channelId);
    const streams = await fetchStreams(person.channelId);

    let oldStreams: Stream[] = [];
    try {
      oldStreams = JSON.parse(
        fs.readFileSync(join(STREAMS_DIR, person.name + ".json"), "utf-8")
      ) as Stream[];
    } catch (err) {}

    const merged = sortObject(
      merge(arrayToObject(oldStreams, "id"), arrayToObject(streams, "id")),
      "created"
    );

    fs.writeFileSync(
      join(STREAMS_DIR, person.name + ".json"),
      JSON.stringify(Object.values(merged), null, 2)
    );
  }

  const indexFiles = fs
    .readdirSync(STREAMS_DIR)
    .map((f) => join(STREAMS_DIR, f));

  const transcripts = await loadTranscripts(indexFiles);

  // Create speeches
  const speeches = transcripts.flatMap((t) => {
    return t.transcript
      .map((seg): Speech => {
        const text = stringify(seg.snippet)
          .split(" ")
          .filter((word) => !/\[(?:Tepuk tangan|Musik|Tertawa)\]/.test(word))
          .join(" ")
          .replace(/\n\n/g, ". ")
          .replace(/\u200b/g, "");
        return {
          id: t.id + "-" + seg.startMs,
          text,
          start: Math.floor(seg.startMs / 1000),
          end: Math.floor(seg.endMs / 1000),
          video: t.id,
        };
      })
      .filter((seg) => {
        const wordCount = seg.text.split(" ").length;
        return wordCount >= 4 && wordCount < 100;
      });
  });
  fs.writeFileSync(
    join(DIST_DIR, "speeches.json"),
    JSON.stringify(speeches, null, 2)
  );

  const combined = stringifyTranscript(
    transcripts.flatMap((t) => t.transcript)
  ).replace(/\u200b/g, "");
  const corpus = removeStopWords(combined);

  // Create bi-gram
  const bigram = genBigram(corpus);
  const bigramSortedByFreq = sort(count(bigram))
    .filter((pair) => !/hai|ya|oke/.test(pair[0]))
    .filter(([_, freq]) => freq >= 5);

  fs.writeFileSync(
    join(DIST_DIR, "bigram.csv"),
    bigramSortedByFreq.map((pair) => pair.join(",")).join("\n") + "\n"
  );

  // Create vocabs
  const vocab = generateVocab(corpus).filter(([_, freq]) => freq >= 5);

  fs.writeFileSync(
    join(DIST_DIR, "vocab.csv"),
    vocab.map((pair) => pair.join(",")).join("\n") + "\n"
  );

  // Create and update dictionary
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
    fs.readFileSync(join(DIST_DIR, "dictionary.json"), "utf-8")
  ) as Record<string, Entry>;

  let dict = merge(oldDict, dictFromVocab) as Record<string, Entry>;

  for (const i in dict) {
    if (!dict[i].meaning) {
      dict[i].meaning = getMeaning(i) ?? "";
    }
  }

  // dict = sortObject(dict, "frequency");
  dict = filterObject(dict, (ent) => ent.frequency >= 3);

  // console.log(Object.entries(dict).slice(0, 100));

  fs.writeFileSync(
    join(DIST_DIR, "dictionary.json"),
    JSON.stringify(dict, null, 2)
  );

  fs.writeFileSync(
    join(DIST_DIR, "dictionary.csv"),
    await csv.stringify(
      Object.entries(dict).map(([title, entry]) => [title, entry.meaning])
    )
  );
}

main();

interface Entry {
  meaning?: string;
  frequency: number;
}

interface Person {
  name: string;
  channelId: string;
}

interface HolodexStream {
  id: string;
  title: string;
  published_at: string;
}

interface Stream {
  title: string;
  id: string;
  created: string;
  available?: boolean;
}

interface Speech {
  id: string;
  text: string;
  start: number;
  end: number;
  video: string;
}
