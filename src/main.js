const vttToText = require("vtt-to-text");
const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { words } = require("./words");
const path = require("path");

function count(arr) {
  const res = {};
  for (const i of arr) {
    if (res[i]) {
      res[i] += 1;
    } else {
      res[i] = 1;
    }
  }
  return res;
}

function sort(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

async function readVtt(input) {
  const vtt = readFileSync(input, "utf-8");
  const text = vttToText.vttToPlainText(vtt);
  return text;
}

async function main() {
  const inputs = readdirSync("./data").map((f) => process.cwd() + "/data/" + f);
  const text = (await Promise.all(inputs.map(readVtt))).join(" ");

  console.log(inputs.map((s) => path.basename(s)).join("\n"));

  const corpus = text
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(/,/, ""))
    .filter((word) => !/^(\d+|.)$/.test(word))
    .filter((word) => !words.includes(word));

  const bigram = corpus
    .reduce((sum, w) => {
      if (sum.length > 0) sum[sum.length - 1].push(w);
      sum.push([w]);
      return sum;
    }, [])
    .map((pair) => pair.join(" "));
  const freq_bigram = sort(count(bigram)).filter(
    (pair) => !/hai|ya|oke/.test(pair[0])
  );
  writeFileSync(
    "bigram.csv",
    freq_bigram.map((pair) => pair.join(",")).join("\n") + "\n"
  );

  const vocab = sort(count(corpus));

  console.log(vocab.length, "words total");

  for (const [word, freq] of vocab.filter(([_, freq]) => freq > 100)) {
    console.log(word, "\t", freq);
  }

  writeFileSync(
    "vocab.csv",
    vocab.map((pair) => pair.join(",")).join("\n") + "\n"
  );
}

main();
