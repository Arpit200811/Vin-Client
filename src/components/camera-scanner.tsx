import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";
import { BASE_URL } from "../lib/Service";

export default function CameraScanner({
  onVinDetected,
}: {
  onVinDetected: (vin: string) => void;
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // <--- IMPROVED: Capture logic with precise cropping ---
  const handleCapture = () => {
    if (!videoRef.current) {
      toast({ title: "Video element not found", variant: "destructive" });
      return;
    }

    setIsScanning(true);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    // --- Start of Accurate Crop Calculation ---

    // 1. Get dimensions
    const videoWidth = video.videoWidth; // Actual video resolution width
    const videoHeight = video.videoHeight; // Actual video resolution height
    const elementWidth = video.clientWidth; // Displayed element width
    const elementHeight = video.clientHeight; // Displayed element height

    // 2. Calculate aspect ratios
    const videoAspectRatio = videoWidth / videoHeight;
    const elementAspectRatio = elementWidth / elementHeight;

    let finalWidth, finalHeight, xOffset, yOffset;

    // 3. Determine how the video is scaled and centered by "object-cover"
    if (elementAspectRatio > videoAspectRatio) {
      // Element is wider than video; video is scaled to element's height
      finalHeight = elementHeight;
      finalWidth = finalHeight * videoAspectRatio;
      yOffset = 0;
      xOffset = (elementWidth - finalWidth) / 2;
    } else {
      // Element is taller or same ratio; video is scaled to element's width
      finalWidth = elementWidth;
      finalHeight = finalWidth / videoAspectRatio;
      xOffset = 0;
      yOffset = (elementHeight - finalHeight) / 2;
    }

    // 4. Calculate the source rectangle from the original video stream
    const scaleX = videoWidth / finalWidth;
    const scaleY = videoHeight / finalHeight;
    
    // The yellow rectangle on screen
    const rectOnScreen = {
      width: 400,
      height: 80,
    };

    const sourceX = (elementWidth / 2 - rectOnScreen.width / 2 - xOffset) * scaleX;
    const sourceY = (elementHeight / 2 - rectOnScreen.height / 2 - yOffset) * scaleY;
    const sourceWidth = rectOnScreen.width * scaleX;
    const sourceHeight = rectOnScreen.height * scaleY;
    
    // --- End of Accurate Crop Calculation ---

    canvas.width = rectOnScreen.width; // Keep output canvas size constant for consistency
    canvas.height = rectOnScreen.height;
    
    const ctx = canvas.getContext("2d")!;
    // Draw the calculated source rectangle onto the canvas
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

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setIsScanning(false);
          toast({ title: "Failed to create image blob", variant: "destructive" });
          return;
        }

        const formData = new FormData();
        formData.append("image", blob, "vin_capture.jpg");

        try {
          const response = await axios.post(
            `${BASE_URL}/api/scan-vin`,
            formData
          );

          if (response.data && response.data.vin) {
            toast({
              title: "VIN Detected!",
              description: `VIN: ${response.data.vin}`,
            });
            onVinDetected(response.data.vin);
          } else {
            toast({
              title: "VIN Not Found",
              description:
                "Could not find a VIN in the image. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error("Capture API error:", error);
          toast({
            title: "Scan Failed",
            description: "An error occurred while scanning.",
            variant: "destructive",
          });
        } finally {
          setIsScanning(false);
        }
      },
      "image/jpeg",
      0.95
    );
  };

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
                Click the <strong>Capture VIN</strong> button to scan the image.
              </li>
              <li>If a VIN is found, the form will appear below.</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}