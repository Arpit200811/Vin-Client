import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";

export default function CameraScanner({ onVinDetected }: { onVinDetected: (vin: string) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [predictions, setPredictions] = useState<Array<{ className: string; probability: number }>>([]);
  const [isScanning, setIsScanning] = useState(false);

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/E2_QPc8m4/"; // your model
  const API_URL = "http://localhost:5000/api/scan-vin"; // backend

  // Load Teachable Machine Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load TM model:", err);
        alert("Model failed to load!");
      }
    };
    loadModel();
  }, []);

  const handleCapture = async () => {
    if (!webcamRef.current || !model) return alert("Camera or model not ready!");
    setIsScanning(true);

    const video = webcamRef.current.video;
    if (!video) return alert("Video not ready!");

    // Yellow rectangle dimensions
    const rectWidth = 400;
    const rectHeight = 80;

    // Create canvas and crop rectangle area
    const canvas = document.createElement("canvas");
    canvas.width = rectWidth;
    canvas.height = rectHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return alert("Canvas error");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const elementWidth = video.clientWidth;
    const elementHeight = video.clientHeight;

    const videoAspectRatio = videoWidth / videoHeight;
    const elementAspectRatio = elementWidth / elementHeight;

    let finalWidth, finalHeight, xOffset, yOffset;
    if (elementAspectRatio > videoAspectRatio) {
      finalHeight = elementHeight;
      finalWidth = finalHeight * videoAspectRatio;
      yOffset = 0;
      xOffset = (elementWidth - finalWidth) / 2;
    } else {
      finalWidth = elementWidth;
      finalHeight = finalWidth / videoAspectRatio;
      xOffset = 0;
      yOffset = (elementHeight - finalHeight) / 2;
    }

    const scaleX = videoWidth / finalWidth;
    const scaleY = videoHeight / finalHeight;

    const sourceX = (elementWidth / 2 - rectWidth / 2 - xOffset) * scaleX;
    const sourceY = (elementHeight / 2 - rectHeight / 2 - yOffset) * scaleY;
    const sourceWidth = rectWidth * scaleX;
    const sourceHeight = rectHeight * scaleY;

    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, rectWidth, rectHeight);

    try {
      const prediction = await model.predict(canvas);
      setPredictions(prediction);

      const topPrediction = prediction.reduce((prev, curr) =>
        prev.probability > curr.probability ? prev : curr
      );
      const classNameLower = topPrediction.className.toLowerCase();

      if (classNameLower.includes("metal") && topPrediction.probability > 0.9) {
        canvas.toBlob(async (blob) => {
          if (!blob) return alert("Blob creation failed");

          const formData = new FormData();
          formData.append("image", blob, "vin_metal.jpg");

          try {
            console.log("Uploading to backend...");
            const response = await axios.post(API_URL, formData);
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
          }
        }, "image/jpeg", 0.95);
      } else {
        alert(`${topPrediction.className} detected with ${(topPrediction.probability * 100).toFixed(2)}%`);
      }
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Prediction failed!");
    } finally {
      setIsScanning(false);
    }
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
          {/* Yellow rectangle overlay */}
          <div className="absolute border-2 border-yellow-400 w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md"></div>
        </div>
      )}

      <div className="flex space-x-2">
        <button onClick={() => setIsCameraActive(prev => !prev)} disabled={isScanning}>
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
