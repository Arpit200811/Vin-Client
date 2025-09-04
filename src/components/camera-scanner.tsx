import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { BASE_URL } from "../lib/Service";

export default function CameraScanner({
  onVinDetected,
}: {
  onVinDetected: (vin: string) => void;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [predictions, setPredictions] = useState<
    Array<{ className: string; probability: number }>
  >([]);
  const [isScanning, setIsScanning] = useState(false);

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/E2_QPc8m4/";

  // Load model once
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tmImage.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );
        setModel(loadedModel);
        console.log("Model loaded ✅");
      } catch (err) {
        console.error("Failed to load model:", err);
        alert("Model failed to load!");
      }
    };
    loadModel();
  }, []);

  // Handle capture & prediction
  const handleCapture = async () => {
    if (!webcamRef.current || !model)
      return alert("Camera or model not ready!");
    const screenshotBase64 = webcamRef.current.getScreenshot();
    if (!screenshotBase64) return alert("Screenshot failed!");

    const img = new Image();
    img.src = screenshotBase64;

    img.onload = async () => {
      const rectWidth = 400;
      const rectHeight = 80;
      const canvas = document.createElement("canvas");
      canvas.width = rectWidth;
      canvas.height = rectHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return alert("Canvas error");

      const sx = img.width / 2 - rectWidth / 2;
      const sy = img.height / 2 - rectHeight / 2;
      ctx.drawImage(
        img,
        sx,
        sy,
        rectWidth,
        rectHeight,
        0,
        0,
        rectWidth,
        rectHeight
      );

      try {
        const prediction = await model.predict(canvas);
        setPredictions(prediction);
        // Find highest probability prediction
        const topPrediction = prediction.reduce((prev, curr) =>
          prev.probability > curr.probability ? prev : curr
        );
        const classNameLower = topPrediction.className.toLowerCase();
        const probability = topPrediction.probability;
        if (classNameLower.includes("paper") && probability >= 0.9) {
          alert(`VIN on Paper ❌ (${(probability * 100).toFixed(2)}%)`);
          setIsScanning(false);
          return;
        }
        if (classNameLower.includes("matel vin") && probability >= 0.9) {
          alert(`Metal detected ✅ ${(probability * 100).toFixed(2)}%`);
          setIsScanning(true);
          canvas.toBlob(
            async (blob) => {
              if (!blob) return alert("Blob creation failed");
              const formData = new FormData();
              formData.append("image", blob, "vin_metal.jpg");

              try {
                const response = await axios.post(
                  `${BASE_URL}/api/scan-vin`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
                console.log("Backend response:", response.data);
                if (response.data.vin) {
                  alert(`Metal VIN Uploaded ✅ VIN: ${response.data.vin}`);
                  onVinDetected(response.data.vin);
                } else {
                  alert("VIN not recognized");
                }
              } catch (err) {
                console.error("Upload error:", err);
                alert("Upload failed!");
              } finally {
                setIsScanning(false);
              }
            },
            "image/jpeg",
            0.95
          );
          return;
        }
        // --- OTHER CASES ---
        // alert(
        //   `Surface unclear ❓ ${topPrediction.className} (${(
        //     probability * 100
        //   ).toFixed(2)}%)`
        // );
        // setIsScanning(false);
      } catch (err) {
        console.error("Prediction error:", err);
        alert("Prediction failed!");
        setIsScanning(false);
      }
    };
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {isCameraActive && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-[400px] h-[300px] border"
          />
          {/* Yellow scanning box */}
          <div className="absolute border-2 border-yellow-400 w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md"></div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => setIsCameraActive((prev) => !prev)}
          disabled={isScanning}
        >
          {isCameraActive ? "Stop Camera" : "Start Camera"}
        </button>

        <button onClick={handleCapture} disabled={!isCameraActive || isScanning}>
          {isScanning ? "Scanning..." : "Capture & Predict"}
        </button>
      </div>

      {predictions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Predictions:</h3>
          {predictions.map((pred, idx) => (
            <div key={idx}>
              {pred.className}: {(pred.probability * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
