import fs from "fs";
import { Masterchat, stringify, TranscriptSegment } from "masterchat";
import path from "path";

async function fetchTranscript(
  id: string
): Promise<TranscriptSegment[] | null> {
  console.log("fetching transcript", id);
  const mc = new Masterchat(id, "");
  try {
    const transcript = await mc.getTranscript("id");
    return transcript;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export function stringifyTranscript(transcript: TranscriptSegment[]) {
  return transcript
    .map((e) => stringify(e.snippet))
    .join("\n")
    .replace(/\[(?:Tepuk tangan|Musik|Tertawa)\]/g, "")
    .replace(/[ ]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

export async function getOrCreateTranscriptSegments(
  id: string,
  outDir: string
): Promise<TranscriptSegment[] | null> {
  const cachePath = path.join(outDir, id + ".json");
  try {
    return JSON.parse(
      fs.readFileSync(cachePath, "utf-8")
    ) as TranscriptSegment[];
  } catch (err) {
    const transcript = await fetchTranscript(id);
    if (!transcript) {
      return null;
    }
    fs.writeFileSync(cachePath, JSON.stringify(transcript));
    return transcript;
  }
}
