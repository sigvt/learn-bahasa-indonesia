import csv from "async-csv";
import axios from "axios";
import merge from "deepmerge";
import fs from "fs";
import JSON5 from "json5";
import { stringify, TranscriptSegment } from "masterchat";
import path, { dirname, join } from "path";
import { genBigram, generateVocab } from "./nlp";
import { removeStopWords } from "./stopwords";
import {
  getOrCreateTranscriptSegments,
  stringifyTranscript,
} from "./transcript";
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

async function loadTranscript(file: string) {
  console.log("opening", file);
  const channel = path.basename(file, ".json");
  const index = JSON5.parse(fs.readFileSync(file, "utf-8")) as Stream[];

  const transcripts = [];

  for (const i in index) {
    if (index[i].available === false) {
      continue;
    }
    const id = index[i].id; // Video id
    console.log("loading", id);

    const segments = await getOrCreateTranscriptSegments(id, CACHE_DIR);
    if (!segments) {
      console.log("unavailable", id);
      index[i].available = false;
      fs.writeFileSync(file, JSON.stringify(index, null, 2));
      continue;
    }

    transcripts.push({ id, channel, segments });
  }

  return transcripts;
}

async function updateStreamIndex() {
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
}

function generateSpeeches(
  transcripts: {
    id: string;
    channel: string;
    segments: TranscriptSegment[];
  }[],
  dict: Record<string, Entry>
) {
  for (const ts of transcripts) {
    const { id, segments } = ts;

    const speeches = segments
      .map((seg): Speech | null => {
        const words = stringify(seg.snippet)
          .replace(/\u200b/g, "")
          .split(/[\s\r\n]+/)
          .filter((word) => !/\[(?:Tepuk tangan|Musik|Tertawa)\]/.test(word))
          .filter((word) => word);
        if (!(words.length >= 4 && words.length < 100)) return null;

        const fragments = words.map((word) => {
          const dictEntry = dict[word.toLowerCase().trim()];
          return {
            word,
            meaning: dictEntry?.meaning || undefined,
            freq: dictEntry?.frequency ?? 0,
          };
        });

        return {
          id: ts.id + "-" + seg.startMs,
          fragments,
          start: Math.floor(seg.startMs / 1000),
          end: Math.floor(seg.endMs / 1000),
          video: ts.id,
          channel: ts.channel,
        };
      })
      .filter((seg): seg is Speech => seg !== null);

    fs.writeFileSync(
      join(DIST_DIR, "transcripts", id + ".json"),
      JSON.stringify(speeches, null, 2)
    );
  }
}

async function main() {
  await updateStreamIndex();

  const indexFiles = fs
    .readdirSync(STREAMS_DIR)
    .map((f) => join(STREAMS_DIR, f));

  const transcripts = (
    await Promise.all(indexFiles.map(loadTranscript))
  ).flat();

  const combined = stringifyTranscript(
    transcripts.flatMap((t) => t.segments)
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

  // fs.writeFileSync(
  //   join(DIST_DIR, "vocab.csv"),
  //   vocab.map((pair) => pair.join(",")).join("\n") + "\n"
  // );

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
    join(DIST_DIR, "flashcard.tsv"),
    await csv.stringify(
      Object.entries(sortObject(dict, "frequency"))
        .filter(([_, entry]) => entry.meaning)
        .map(([title, entry]) => [title, entry.meaning]),
      { delimiter: "\t" }
    )
  );

  // Create speeches
  generateSpeeches(transcripts, dict);
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

interface SpeechFragment {
  word: string;
  freq: number;
  meaning?: string;
}

interface Speech {
  id: string;
  fragments: SpeechFragment[];
  start: number;
  end: number;
  video: string;
  channel: string;
}
