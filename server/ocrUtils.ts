import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";

const VALID_VIN_PREFIXES = ["MD", "1M", "2H", "3N", "5Y", "JH", "KL"];

export async function performOcrWithApi(filePath: string, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", createReadStream(filePath));
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("OCREngine", "2");
  const response = await axios.post("https://api.ocr.space/parse/image", formData, {
    headers: formData.getHeaders(),
  });

  if (response.data.IsErroredOnProcessing) {
    throw new Error(`OCR API Error: ${response.data.ErrorMessage}`);
  }
  return response.data.ParsedResults[0]?.ParsedText || "";
}
export function normalizeVinChars(text: string): string {
  const map: Record<string, string> = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
    "Н": "H", "О": "O", "Р": "P", "С": "S", "Т": "T",
    "У": "Y", "Х": "X",
  };
  return text.replace(/[А-Я]/g, char => map[char] || char);
}
export function extractVinFromText(rawText: string): string {
  const normalized = normalizeVinChars(rawText.toUpperCase());
  const cleaned = normalized.replace(/[^A-Z0-9]/g, "");
  const vinMatches:any = cleaned.match(/[A-Z0-9]{17}/g) || [];
  if (vinMatches.length === 0) return "";
  return vinMatches.find((v:any)=> VALID_VIN_PREFIXES.some(prefix => v.startsWith(prefix))) || vinMatches[0];
}
