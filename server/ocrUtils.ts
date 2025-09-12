import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import sharp from "sharp";
import { fft } from "fft-js";
const VALID_VIN_PREFIXES = ["MD", "1M", "2H", "3N", "5Y", "JH", "KL"];
const OCR_API_URL = "https://api.ocr.space/parse/image";

export async function performOcrWithApi(filePath: string, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", createReadStream(filePath));
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("OCREngine", "2");

  const response = await axios.post(OCR_API_URL, formData, {
    headers: formData.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (response.data?.IsErroredOnProcessing) {
    throw new Error(`OCR API Error: ${JSON.stringify(response.data?.ErrorMessage || response.data)}`);
  }
  return response.data?.ParsedResults?.[0]?.ParsedText || "";
}

export function normalizeVinChars(text: string): string {
  const map: Record<string, string> = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
    "Н": "H", "О": "O", "Р": "P", "С": "S", "Т": "T",
    "У": "Y", "Х": "X",
  };
  return text.replace(/[А-Я]/g, char => map[char] || char);
}

export function extractVinFromText(rawText: any): any {
  const normalized = normalizeVinChars(rawText.toUpperCase());
  const cleaned = normalized.replace(/[^A-Z0-9]/g, "");
  const vinMatches = cleaned.match(/[A-Z0-9]{17}/g) || [];
  if (vinMatches.length === 0) return "";
  return vinMatches.find(v => VALID_VIN_PREFIXES.some(prefix => v.startsWith(prefix))) || vinMatches[0];
}


function fftMag([re, im]: [number, number]): number {
  return Math.sqrt(re * re + im * im);
}

export async function detectScreenCapture(buffer: Buffer): Promise<{ isScreen: boolean; score: number }> {
  const { data } = await sharp(buffer)
    .resize(512, 512, { fit: "inside" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const signal: number[] = Array.from(data);
  const sampleSize = Math.min(2048, signal.length);
  const sliced = signal.slice(0, sampleSize);
  if (sliced.length < 256) return { isScreen: false, score: 0 };

  const phasors = fft(sliced);
  const mags = phasors.map(fftMag);
  const mean = mags.reduce((a: any, b: any) => a + b, 0) / mags.length;
  const std = Math.sqrt(mags.map((x: number) => (x - mean) ** 2).reduce((a: any, b: any) => a + b, 0) / mags.length);
  const thresh = mean + 1.5 * std;
  const peaks = mags.filter((x: number) => x > thresh).length;
  const score = peaks / mags.length;
  const isScreen = score > 0.001;

  return { isScreen, score };
}
