import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";
import { performOCR } from "../lib/ocr";
import { validateVIN } from "../lib/vin-validator";

interface CameraScannerProps {
  onVinDetected: (vin: string) => void;
}

export default function CameraScanner({ onVinDetected }: CameraScannerProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [materialType, setMaterialType] = useState<"unknown" | "metal" | "other">("unknown");
  const [scanProgress, setScanProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
    };
  }, []);

  // Start/Stop Camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        stopCamera(streamRef.current);
        streamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await initializeCamera(facingMode);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        toast({
          title: "Camera Active",
          description: `Camera started (${facingMode === "environment" ? "Back" : "Front"})`,
        });
      } catch (error) {
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  // Switch between Front/Back Camera
  const handleSwitchCamera = async () => {
    if (!isCameraActive) {
      toast({
        title: "Camera Not Active",
        description: "Start camera before switching.",
        variant: "destructive",
      });
      return;
    }

    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }

    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);

    try {
      const stream = await initializeCamera(newMode);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast({
        title: "Camera Switched",
        description: `Now using ${newMode === "environment" ? "Back" : "Front"} Camera`,
      });
    } catch (error) {
      toast({
        title: "Switch Failed",
        description: "Unable to switch camera.",
        variant: "destructive",
      });
    }
  };

  // Confirm Material Type
  const handleConfirmMetal = () => {
    setMaterialType("metal");
    toast({
      title: "Metal Detected ✅",
      description: "Proceeding with VIN scan...",
    });
  };

  const handleConfirmOther = () => {
    setMaterialType("other");
    toast({
      title: "Paper/Other Detected ❌",
      description: "Only metal objects are allowed for VIN scanning",
      variant: "destructive",
    });
  };

  // Capture Frame & Run OCR
  const handleCaptureFrame = async () => {
    if (!isCameraActive || !videoRef.current || materialType !== "metal") {
      toast({
        title: "Cannot Scan",
        description:
          materialType === "other"
            ? "Metal confirmation required for VIN scanning"
            : "Please start camera and confirm metal material",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        for (let i = 0; i <= 100; i += 20) {
          setScanProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const extractedText = await performOCR(canvas);
        const validVin = validateVIN(extractedText);

        if (validVin) {
          onVinDetected(validVin);
          toast({
            title: "VIN Detected Successfully",
            description: `Found VIN: ${validVin}`,
          });
        } else {
          toast({
            title: "VIN Not Found",
            description: "No valid VIN detected in the image. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live VIN Scanner
          <div className="flex items-center space-x-2">
            {isCameraActive && (
              <>
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-600 font-medium">Camera Active</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  data-testid="video-camera-feed"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-camera text-gray-600 text-6xl"></i>
                </div>
              )}

              {/* VIN Detection Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-16 border-2 border-primary rounded-lg">
                    <div className="absolute -top-8 left-0 bg-primary text-white px-2 py-1 rounded text-sm">
                      VIN Detection Zone
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center mt-4 space-x-3">
              <Button
                onClick={handleToggleCamera}
                disabled={isScanning}
                data-testid="button-toggle-camera"
              >
                <i className={`fas ${isCameraActive ? "fa-video-slash" : "fa-video"} mr-2`}></i>
                {isCameraActive ? "Stop Camera" : "Start Camera"}
              </Button>

              <Button
                onClick={handleSwitchCamera}
                disabled={!isCameraActive || isScanning}
                variant="outline"
                data-testid="button-switch-camera"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Switch Camera
              </Button>

              <Button
                onClick={handleCaptureFrame}
                disabled={!isCameraActive || isScanning || materialType !== "metal"}
                variant="secondary"
                data-testid="button-capture-frame"
              >
                <i className="fas fa-camera-retro mr-2"></i>
                {isScanning ? "Scanning..." : "Capture"}
              </Button>
            </div>
          </div>

          {/* Detection Status Panel */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Detection Status</h3>

              {/* Material Detection */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Material Type</span>
                <div className="flex items-center space-x-2">
                  {materialType === "metal" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-800">
                      <i className="fas fa-check mr-1"></i>
                      Metal Confirmed
                    </span>
                  ) : materialType === "other" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800">
                      <i className="fas fa-times mr-1"></i>
                      Other Material
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-800">
                      <i className="fas fa-question mr-1"></i>
                      Unknown
                    </span>
                  )}
                </div>
              </div>

              {/* Scan Progress */}
              {isScanning && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Scan Progress</span>
                    <span className="text-gray-600">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Material Type Confirmation */}
            {isCameraActive && materialType === "unknown" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Confirm Material Type</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Please confirm the material type before proceeding with VIN scanning.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleConfirmMetal}
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    data-testid="button-confirm-metal"
                  >
                    <i className="fas fa-check mr-1"></i>
                    Metal
                  </Button>
                  <Button
                    onClick={handleConfirmOther}
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    data-testid="button-confirm-other"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Other
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
