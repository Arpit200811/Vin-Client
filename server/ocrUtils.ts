// server/ocrUtils.ts
import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import sharp from "sharp";
import { fft } from "fft-js";
import exifParser from "exif-parser";
import * as iq from "image-q";

export const VALID_VIN_PREFIXES = ["MD", "1M", "2H", "3N", "5Y", "JH", "KL"];
const OCR_API_URL = "https://api.ocr.space/parse/image";

// ---------------- OCR ----------------
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
    timeout: 120000,
  });

  if (response.data?.IsErroredOnProcessing) {
    throw new Error(`OCR API Error: ${JSON.stringify(response.data?.ErrorMessage || response.data)}`);
  }

  return response.data?.ParsedResults?.[0]?.ParsedText || "";
}

// ---------------- VIN Utilities ----------------
export function normalizeVinChars(text: string): string {
  const map: Record<string, string> = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
    "Н": "H", "О": "O", "Р": "P", "С": "S", "Т": "T",
    "У": "Y", "Х": "X",
  };
  return text.replace(/[А-Я]/g, char => map[char] || char);
}

export function extractVinFromText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";
  const normalized = normalizeVinChars(rawText.toUpperCase());
  const cleaned = normalized.replace(/[^A-Z0-9]/g, "");
  const vinMatches: string[] = cleaned.match(/[A-Z0-9]{17}/g) || [];
  if (vinMatches.length === 0) return "";
  return vinMatches.find(v => VALID_VIN_PREFIXES.some(prefix => v.startsWith(prefix))) || vinMatches[0];
}
function fftMag([re, im]: [number, number]): number {
  return Math.sqrt(re * re + im * im);
}

export async function checkFFT(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(512, 512, { fit: "inside" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const signal: number[] = Array.from(data).slice(0, Math.min(2048, data.length));
  if (signal.length < 256) return { score: 0, reason: "Too small image", fftScore: 0, sliced: signal };
  const phasors = fft(signal);
  const mags = phasors.map(fftMag);
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const std = Math.sqrt(mags.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / mags.length);
  const thresh = mean + 1.5 * std;
  const peaks = mags.filter(x => x > thresh).length;
  const fftScore = peaks / mags.length;

  const reasons: string[] = [];
  if (fftScore > 0.01) reasons.push("Moiré/Screen-like frequency detected");

  return { score: fftScore, reason: reasons.join(", "), fftScore, sliced: signal, width: info.width, height: info.height };
}

// ---------------- Noise Detection ----------------
export function checkNoise(signal: number[]) {
  if (!signal || signal.length === 0) return { score: 0, reason: "No signal", noiseLevel: 0 };
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const noiseLevel = Math.sqrt(signal.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / signal.length) / 255;
  const reasons: string[] = [];
  if (noiseLevel < 0.02 || noiseLevel > 0.25) reasons.push("Abnormal noise pattern");
  return { score: noiseLevel, reason: reasons.join(", "), noiseLevel };
}

// ---------------- EXIF Check ----------------
export function checkExif(buffer: Buffer) {
  const reasons: string[] = [];
  try {
    const parser = exifParser.create(buffer);
    const result = parser.parse();
    if (!result.tags || !result.tags.Make) reasons.push("Missing EXIF metadata");
    return { tags: result.tags || {}, reasons };
  } catch {
    return { tags: null, reasons: ["No EXIF metadata"] };
  }
}
// ---------------- Image-q Color Analysis ----------------
export async function imageQCheck(buffer: Buffer) {
  try {
    const { data, info } = await sharp(buffer)
      .resize(256, 256, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pointContainer = iq.utils.PointContainer.fromUint8Array(data, info.width, info.height);
    const palette: any = await iq.buildPalette([pointContainer], { colors: 16 });
    const quantized: any = await iq.applyPalette(pointContainer, palette);
    const colorMap: Record<string, number> = {};
    for (let i = 0; i < quantized.size; i++) {
      const p = quantized.getPoint(i);
      const key = `${p.r}-${p.g}-${p.b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
    const uniqueColors = Object.keys(colorMap).length;
    const total = quantized.size || 1;
    const topCount = Math.max(...Object.values(colorMap));
    const topColorRatio = topCount / total;
    const reasons: string[] = [];
    if (uniqueColors < 200) reasons.push("Low unique colors after quantization");
    if (topColorRatio > 0.12) reasons.push("Dominant color bin (screen-like)");
    return { uniqueColors, topColorRatio, reasons };
  } catch (err) {
    return { uniqueColors: 0, topColorRatio: 0, reasons: ["image-q error", String(err)] };
  }
}

// ---------------- Full Screen Capture Detection ----------------
export async function detectScreenCapture(buffer: Buffer) {
  const reasons: string[] = [];
  const details: any = {};

  // FFT
  const fftRes = await checkFFT(buffer);
  details.fft = fftRes;
  if (fftRes.reason) reasons.push(...(Array.isArray(fftRes.reason) ? fftRes.reason : [fftRes.reason]));

  // Noise
  const noiseRes = checkNoise(fftRes.sliced || []);
  details.noise = noiseRes;
  if (noiseRes.reason) reasons.push(noiseRes.reason);

  // EXIF
  const exifRes = checkExif(buffer);
  details.exif = exifRes;
  if (exifRes.reasons && exifRes.reasons.length) reasons.push(...exifRes.reasons);

  // image-q
  const iqq = await imageQCheck(buffer);
  details.imageq = iqq;
  if (iqq.reasons && iqq.reasons.length) reasons.push(...iqq.reasons);

  // Composite score (weighted sum)
  let score = 0;
  score += (fftRes.score || 0) * 1.0;
  score += (noiseRes.score || 0) * 1.2;
  if (iqq.uniqueColors && (iqq.uniqueColors < 200 || iqq.topColorRatio > 0.12)) score += 1.0;
  if (!exifRes.tags || Object.keys(exifRes.tags).length === 0) score += 0.8;

  const isScreen = score > 1.5 || (reasons.length > 0 && score > 1.0);

  return { isScreen, score: +score.toFixed(4), reasons: Array.from(new Set(reasons)), details };
}



