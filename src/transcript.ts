import fs from "fs";
import { Masterchat, stringify } from "masterchat";
import path from "path";

async function fetchTranscript(id: string): Promise<string | null> {
  console.log("fetching transcript", id);
  const mc = new Masterchat(id, "");
  try {
    const transcript = await mc.getTranscript("id");
    return transcript
      .map((e) => stringify(e.snippet))
      .join("\n")
      .replace(/\[(?:Tepuk tangan|Musik|Tertawa)\]/g, "")
      .replace(/[ ]+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getOrCreateTranscript(id: string, outDir: string) {
  const cachePath = path.join(outDir, id + ".txt");
  try {
    return fs.readFileSync(cachePath, "utf-8");
  } catch (err) {
    const transcript = await fetchTranscript(id);
    if (!transcript) {
      return null;
    }
    fs.writeFileSync(cachePath, transcript);
    return transcript;
  }
}
