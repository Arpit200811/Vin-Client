// // lib/ocr.ts
// import Tesseract from "tesseract.js";

// export async function performOCR(
//   canvas: HTMLCanvasElement
// ): Promise<string> {
//   try {
//     // OCR processing
//     const { data } = await Tesseract.recognize(canvas, "eng", {
//       logger: (m) => console.log(m), // optional: shows progress in console
//     });

//     let text = data.text || "";

//     // Cleanup text (VIN/Chassis me unwanted spaces & newlines hatao)
//     text = text.replace(/\s+/g, "").toUpperCase();

//     // VIN standard: 17 characters (letters + numbers, excluding I, O, Q)
//     const vinRegex = /[A-HJ-NPR-Z0-9]{11,20}/g;
//     const matches = text.match(vinRegex);

//     if (matches && matches.length > 0) {
//       return matches[0]; // sabse pehla match return karo
//     }

//     return text; // agar VIN match na mile to raw text return karo
//   } catch (err) {
//     console.error("❌ OCR failed:", err);
//     return "";
//   }
// }


export async function performOCR(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    try {
      // @ts-ignore
      const ocr = (window as any).ml5.OCR({ task: "text" }, () => {
        ocr.predict(canvas, (err: any, results: any) => {
          if (err) {
            console.error("❌ OCR failed:", err);
            resolve(""); // fallback to empty string
            return;
          }

          let text = results.map((r: any) => r.label).join("").toUpperCase();
          text = text.replace(/\s+/g, "");
          const vinRegex = /[A-HJ-NPR-Z0-9]{11,20}/g;
          const matches = text.match(vinRegex);
          resolve(matches?.[0] || "");
        });
      });
    } catch (err) {
      console.error("❌ OCR failed:", err);
      resolve(""); // fallback
    }
  });
}


