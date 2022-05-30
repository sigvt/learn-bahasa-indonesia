const { MeiliSearch } = require("meilisearch");
const glob = require("glob");
const { readFileSync } = require("fs");

async function main() {
  const client = new MeiliSearch({ host: "http://127.0.0.1:7700" });

  const speechFiles = glob.sync("../dictionary/build/transcripts/*.json");
  for (const file of speechFiles) {
    const speeches = JSON.parse(readFileSync(file, "utf-8"));
    console.log(file, speeches[0]);

    try {
      await client.index("speeches").updateFilterableAttributes(["channel"]);
      const res = await client.index("speeches").addDocuments(speeches);
      console.log(res);
    } catch (e) {
      console.log("Meili error: ", e.message);
    }
  }
}

main();
