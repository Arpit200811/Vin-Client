import Tesseract from 'tesseract.js';

export async function performOCR(canvas: HTMLCanvasElement): Promise<string> {
  try {
    // Convert canvas to image data
    const imageData = canvas.toDataURL('image/png');
    
    // Perform OCR using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
      logger: m => console.log(m) // Optional logging
    });
    
    return text.replace(/\s+/g, '').toUpperCase(); // Remove whitespace and convert to uppercase
  } catch (error) {
    console.error("OCR failed:", error);
    throw new Error("Failed to extract text from image");
  }
}
