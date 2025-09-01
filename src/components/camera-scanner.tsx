import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";

export default function CameraScanner({ onVinDetected }: { onVinDetected: (vin: string) => void }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // Used for loading state on the capture button
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // <--- MODIFIED: This function is now for manual capture on button click
  const handleCapture = () => {
    if (!videoRef.current) return;

    setIsScanning(true); // Start loading state

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    const rectWidth = 400;
    const rectHeight = 80;
    const rectX = video.videoWidth / 2 - rectWidth / 2;
    const rectY = video.videoHeight / 2 - rectHeight / 2;

    canvas.width = rectWidth;
    canvas.height = rectHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, rectX, rectY, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", blob, "vin_capture.jpg");

      try {
        const response = await axios.post("http://localhost:5000/api/scan-vin", formData);

        if (response.data && response.data.vin) {
          toast({ title: "VIN Detected!", description: `VIN: ${response.data.vin}` });
          onVinDetected(response.data.vin);
        } else {
          // <--- MODIFIED: Handle case where backend finds no VIN
          toast({ title: "VIN Not Found", description: "Could not find a VIN in the image. Please try again.", variant: "destructive"});
        }
      } catch (error: any) {
        console.error("Capture API error:", error);
        toast({ title: "Scan Failed", description: "An error occurred while scanning.", variant: "destructive"});
      } finally {
        setIsScanning(false); // End loading state
      }
    }, "image/jpeg", 0.95);
  };

  // <--- REMOVED: The useEffect hook for the auto-capture loop has been removed.

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
        toast({ title: "Camera Error", variant: "destructive", description: "Please grant camera permissions." });
      }
    }
  };

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
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
              <Button onClick={handleSwitchCamera} disabled={!isCameraActive || isScanning} variant="outline">
                Switch Camera
              </Button>
              {/* --- NEW BUTTON --- */}
              <Button onClick={handleCapture} disabled={!isCameraActive || isScanning} variant="secondary">
                {isScanning ? "Scanning..." : "Capture VIN"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 flex flex-col justify-center items-center bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">Instructions</h3>
            {/* --- MODIFIED INSTRUCTIONS --- */}
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>Click <strong>Start Camera</strong> to begin.</li>
              <li>Align the vehicle's VIN number inside the yellow rectangle.</li>
              <li>Click the <strong>Capture VIN</strong> button to scan the image.</li>
              <li>If a VIN is found, the form will appear below.</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}