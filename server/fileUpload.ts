import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export async function handleFileUpload(file: any, uploadFolder = "uploads"): Promise<{ filePath: string, publicUrl: string }> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  if (!file) return { filePath: "", publicUrl: "" };
  const uploadDir = path.join(__dirname, "..", uploadFolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(uploadDir, fileName);
  await file.mv(filePath);
  return {
    filePath,                 // OCR ke liye
    publicUrl: `/${uploadFolder}/${fileName}`  
  };
}
