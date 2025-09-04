import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { BASE_URL } from "../lib/Service";

export default function CameraScanner({
  onVinDetected,
}: {
  onVinDetected: (vin: string) => void;
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [predictions, setPredictions] = useState<
    Array<{ className: string; probability: number }>
  >([]);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/E2_QPc8m4/"; // Replace with your model URL

  // Load Teachable Machine Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tmImage.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load TM model:", err);
        toast({ title: "Model Load Failed", variant: "destructive" });
      }
    };
    loadModel();
  }, [toast]);

  // Capture and Predict
  const handleCapture = async () => {
    if (!videoRef.current || !model) {
      toast({ title: "Camera or Model not ready", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    // Yellow rectangle crop dimensions
    const rectOnScreen = { width: 400, height: 80 };
    canvas.width = rectOnScreen.width;
    canvas.height = rectOnScreen.height;

    // Calculate crop coordinates
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

    const sourceX =
      (elementWidth / 2 - rectOnScreen.width / 2 - xOffset) * scaleX;
    const sourceY =
      (elementHeight / 2 - rectOnScreen.height / 2 - yOffset) * scaleY;
    const sourceWidth = rectOnScreen.width * scaleX;
    const sourceHeight = rectOnScreen.height * scaleY;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    try {
      const prediction = await model.predict(canvas);
      setPredictions(prediction);

      const topPrediction = prediction.reduce((prev, curr) =>
        prev.probability > curr.probability ? prev : curr
      );
      const classNameLower = topPrediction.className.toLowerCase();

      // ✅ Upload only when Metal detected with >90% probability
      if (classNameLower.includes("metal") && topPrediction.probability > 0.9) {
        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append("image", blob, "vin_metal.jpg");

            try {
              const response = await axios.post(
                `${BASE_URL}/api/scan-vin`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              if (response.data.vin) {
                toast({
                  title: "Metal VIN Uploaded ✅",
                  description: `VIN: ${response.data.vin}`,
                });
                onVinDetected(response.data.vin);
              } else {
                toast({
                  title: "VIN not recognized",
                  variant: "destructive",
                });
              }
            } catch (err) {
              console.error("Upload error:", err);
              toast({ title: "Upload failed", variant: "destructive" });
            }
          },
          "image/jpeg",
          0.95
        );
      } else {
        // Paper / Other → just show toast
        toast({
          title: topPrediction.className,
          description: `Probability: ${(topPrediction.probability * 100).toFixed(
            2
          )}%`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Prediction error:", err);
      toast({ title: "Prediction failed", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) stopCamera(streamRef.current);
      streamRef.current = null;
      setIsCameraActive(false);
    } else {
      try {
        const stream = await initializeCamera(facingMode);
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast({ title: "Camera Active" });
      } catch {
        toast({
          title: "Camera Error",
          variant: "destructive",
          description: "Please grant camera permissions.",
        });
      }
    }
  };

  // Switch Camera
  const handleSwitchCamera = async () => {
    if (!isCameraActive) return;
    if (streamRef.current) stopCamera(streamRef.current);
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    try {
      const stream = await initializeCamera(newMode);
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      toast({ title: "Camera Switched" });
    } catch {
      toast({ title: "Switch Failed", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live VIN Scanner
          {isCameraActive && (
            <span className="flex items-center space-x-2 text-green-600 font-medium">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              Camera Active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Preview */}
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-camera text-gray-600 text-6xl"></i>
                  <p className="ml-4 text-gray-500">Camera is off</p>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute border-2 border-yellow-400 w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md shadow-lg"></div>
              )}
            </div>

            <div className="flex justify-center mt-4 space-x-3">
              <Button onClick={handleToggleCamera} disabled={isScanning}>
                {isCameraActive ? "Stop Camera" : "Start Camera"}
              </Button>
              <Button
                onClick={handleSwitchCamera}
                disabled={!isCameraActive || isScanning}
                variant="outline"
              >
                Switch Camera
              </Button>
              <Button
                onClick={handleCapture}
                disabled={!isCameraActive || isScanning}
                variant="secondary"
              >
                {isScanning ? "Scanning..." : "Capture VIN"}
              </Button>
            </div>
          </div>

          {/* Instructions + Predictions */}
          <div className="space-y-4 flex flex-col justify-center items-center bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">Instructions</h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>
                Click <strong>Start Camera</strong> to begin.
              </li>
              <li>
                Align the vehicle's VIN number inside the yellow rectangle.
              </li>
              <li>
                Click <strong>Capture VIN</strong> to scan only the rectangle.
              </li>
              <li>
                If Metal VIN is detected with <strong>&gt;90%</strong>{" "}
                probability, it will be uploaded to backend.
              </li>
              <li>
                If Paper/Other is detected, a toast alert will show.
              </li>
            </ol>

            {predictions.length > 0 && (
              <div className="mt-4 text-center">
                <h4 className="font-medium">Predictions:</h4>
                {predictions.map((pred, idx) => (
                  <div key={idx}>
                    {pred.className}:{" "}
                    {(pred.probability * 100).toFixed(2)}%
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}