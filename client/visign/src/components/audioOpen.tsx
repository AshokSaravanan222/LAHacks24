import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY // This is also the default, can be omitted
  });
const speechFile = path.resolve("./speech.mp3");

async function tts(text:string) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
export default  tts;

