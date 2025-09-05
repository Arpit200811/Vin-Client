import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export async function handleFileUpload(file: any, uploadFolder = "uploads"): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  if (!file) return "";
  const uploadDir = path.join(__dirname, "..", uploadFolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  // Move file
  await file.mv(filePath);

  // Return public URL
  return `/${uploadFolder}/${fileName}`;
}
