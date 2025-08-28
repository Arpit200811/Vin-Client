// import { useState, useRef, useEffect } from "react";
// import { Button } from "../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { useToast } from "../hooks/use-toast";
// import { initializeCamera, stopCamera } from "../lib/camera";
// import { performOCR } from "../lib/ocr";
// import { validateVIN } from "../lib/vin-validator";

// import * as tf from "@tensorflow/tfjs";
// import '@tensorflow/tfjs-backend-webgl';
// import * as mobilenet from "@tensorflow-models/mobilenet";

// interface CameraScannerProps {
//   onVinDetected: (vin: string) => void;
// }

// export default function CameraScanner({ onVinDetected }: CameraScannerProps) {
//   const [isCameraActive, setIsCameraActive] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [materialType, setMaterialType] = useState<"unknown" | "metal" | "other">("unknown");
//   const [scanProgress, setScanProgress] = useState(0);
//   const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const { toast } = useToast();
//   const modelRef = useRef<mobilenet.MobileNet | null>(null);

//   // Initialize TensorFlow + MobileNet
//   useEffect(() => {
//     async function loadModel() {
//       await tf.setBackend("webgl");
//       await tf.ready();
//       modelRef.current = await mobilenet.load();
//       console.log("MobileNet model loaded");
//     }
//     loadModel();

//     return () => {
//       if (streamRef.current) stopCamera(streamRef.current);
//     };
//   }, []);

//   const detectMaterial = async (canvas: HTMLCanvasElement) => {
//     if (!modelRef.current) return "unknown";
//     const predictions = await modelRef.current.classify(canvas);
//     const topClass = predictions[0]?.className.toLowerCase() || "";
//     if (topClass.includes("metal")) return "metal";
//     return "other";
//   };

//   const handleCaptureFrame = async () => {
//     if (!isCameraActive || !videoRef.current) {
//       toast({ title: "Camera inactive", variant: "destructive" });
//       return;
//     }

//     setIsScanning(true);
//     setScanProgress(0);

//     try {
//       const canvas = document.createElement("canvas");
//       const video = videoRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       const ctx = canvas.getContext("2d");
//       if (!ctx) throw new Error("Cannot get canvas context");
//       ctx.drawImage(video, 0, 0);

//       // Material detection
//       const detectedMaterial = await detectMaterial(canvas);
//       setMaterialType(detectedMaterial);

//       if (detectedMaterial !== "metal") {
//         toast({ title: "Wrong Material", description: "VIN scan only allowed on metal", variant: "destructive" });
//         setIsScanning(false);
//         return;
//       }

//       // Scan progress animation
//       for (let i = 0; i <= 100; i += 20) {
//         setScanProgress(i);
//         await new Promise(res => setTimeout(res, 150));
//       }

//       // OCR + VIN validation
//       const extractedText = await performOCR(canvas);
//       const validVin = validateVIN(extractedText);

//       if (validVin) {
//         onVinDetected(validVin);
//         toast({ title: "VIN Detected", description: `VIN: ${validVin}` });
//       } else {
//         toast({ title: "VIN Not Found", variant: "destructive" });
//       }
//     } catch (err) {
//       console.error(err);
//       toast({ title: "Scan Failed", variant: "destructive" });
//     } finally {
//       setIsScanning(false);
//       setScanProgress(0);
//     }
//   };

//   const handleToggleCamera = async () => {
//     if (isCameraActive) {
//       if (streamRef.current) stopCamera(streamRef.current);
//       streamRef.current = null;
//       setIsCameraActive(false);
//     } else {
//       try {
//         const stream = await initializeCamera(facingMode);
//         if (videoRef.current) videoRef.current.srcObject = stream;
//         streamRef.current = stream;
//         setIsCameraActive(true);
//         toast({ title: "Camera Active" });
//       } catch {
//         toast({ title: "Camera Error", variant: "destructive" });
//       }
//     }
//   };

//   const handleSwitchCamera = async () => {
//     if (!isCameraActive) return;
//     if (streamRef.current) stopCamera(streamRef.current);
//     const newMode = facingMode === "environment" ? "user" : "environment";
//     setFacingMode(newMode);
//     try {
//       const stream = await initializeCamera(newMode);
//       if (videoRef.current) videoRef.current.srcObject = stream;
//       streamRef.current = stream;
//       toast({ title: "Camera Switched" });
//     } catch {
//       toast({ title: "Switch Failed", variant: "destructive" });
//     }
//   };

//   return (
//     <Card>
//       <CardHeader><CardTitle>Live VIN Scanner</CardTitle></CardHeader>
//       <CardContent>
//         <div className="grid lg:grid-cols-2 gap-6">
//           <div className="relative">
//             <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
//               {isCameraActive ? (
//                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
//               ) : (
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <i className="fas fa-camera text-gray-600 text-6xl"></i>
//                 </div>
//               )}
//             </div>
//             <div className="flex justify-center mt-4 space-x-3">
//               <Button onClick={handleToggleCamera} disabled={isScanning}>
//                 {isCameraActive ? "Stop Camera" : "Start Camera"}
//               </Button>
//               <Button onClick={handleSwitchCamera} disabled={!isCameraActive || isScanning} variant="outline">
//                 Switch Camera
//               </Button>
//               <Button onClick={handleCaptureFrame} disabled={!isCameraActive || isScanning} variant="secondary">
//                 {isScanning ? "Scanning..." : "Capture"}
//               </Button>
//             </div>
//           </div>
//           <div className="space-y-4">
//             <div>Material: {materialType}</div>
//             {isScanning && <div>Progress: {scanProgress}%</div>}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";
import { performOCR } from "../lib/ocr";
import { validateVIN } from "../lib/vin-validator";

import * as tf from "@tensorflow/tfjs";
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from "@tensorflow-models/mobilenet";

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
  const modelRef = useRef<mobilenet.MobileNet | null>(null);
  const { toast } = useToast();

  // Initialize MobileNet
  useEffect(() => {
    async function loadModel() {
      await tf.setBackend("webgl");
      await tf.ready();
      modelRef.current = await mobilenet.load();
      console.log("MobileNet loaded");
    }
    loadModel();

    return () => {
      if (streamRef.current) stopCamera(streamRef.current);
    };
  }, []);

  const detectMaterial = async (canvas: HTMLCanvasElement) => {
    if (!modelRef.current) return "unknown";
    const predictions = await modelRef.current.classify(canvas);
    const topClass = predictions[0]?.className.toLowerCase() || "";
    if (topClass.includes("metal")) return "metal";
    return "other";
  };

  // --- Capture + OCR + VIN logic ---
  const handleCaptureFrame = async () => {
    if (!isCameraActive || !videoRef.current) {
      toast({ title: "Camera inactive", variant: "destructive" });
      return;
    }

    if (materialType !== "metal") {
      toast({
        title: "Material Not Confirmed",
        description: "Please confirm Metal to scan VIN",
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
      if (!ctx) throw new Error("Cannot get canvas context");
      ctx.drawImage(video, 0, 0);

      // --- Auto detect material during scan ---
      const detectedMaterial = await detectMaterial(canvas);
      if (detectedMaterial !== "metal") {
        toast({
          title: "Wrong Material Detected",
          description: "Scan only allowed on metal",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      // Simulate scan progress
      for (let i = 0; i <= 100; i += 20) {
        setScanProgress(i);
        await new Promise(res => setTimeout(res, 150));
      }

      const extractedText = await performOCR(canvas);
      const validVin = validateVIN(extractedText);

      if (validVin) {
        onVinDetected(validVin);
        toast({ title: "VIN Detected", description: `VIN: ${validVin}` });
      } else {
        toast({ title: "VIN Not Found", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Scan Failed", variant: "destructive" });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // --- Camera Controls ---
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
        toast({ title: "Camera Error", variant: "destructive" });
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

  const handleConfirmMetal = () => {
    setMaterialType("metal");
    toast({ title: "Metal Confirmed ✅", description: "Ready to scan VIN" });
  };

  const handleConfirmOther = () => {
    setMaterialType("other");
    toast({ title: "Other Material ❌", variant: "destructive" });
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
          {/* Camera Feed */}
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-camera text-gray-600 text-6xl"></i>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center mt-4 space-x-3">
              <Button onClick={handleToggleCamera} disabled={isScanning}>
                {isCameraActive ? "Stop Camera" : "Start Camera"}
              </Button>
              <Button onClick={handleSwitchCamera} disabled={!isCameraActive || isScanning} variant="outline">
                Switch Camera
              </Button>
              <Button onClick={handleCaptureFrame} disabled={!isCameraActive || isScanning || materialType !== "metal"} variant="secondary">
                {isScanning ? "Scanning..." : "Capture"}
              </Button>
            </div>
          </div>

          {/* Detection Status & Material Confirmation */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Detection Status</h3>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Material Type</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  materialType === "metal"
                    ? "bg-green-50 text-green-800"
                    : materialType === "other"
                    ? "bg-red-50 text-red-800"
                    : "bg-gray-50 text-gray-800"
                }`}>
                  {materialType === "metal" ? "Metal Confirmed" : materialType === "other" ? "Other Material" : "Unknown"}
                </span>
              </div>
              {isScanning && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Scan Progress</span>
                    <span className="text-gray-600">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {isCameraActive && materialType === "unknown" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Confirm Material Type</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Please confirm the material type before proceeding with VIN scanning.
                </p>
                <div className="flex space-x-2">
                  <Button onClick={handleConfirmMetal} size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                    Metal
                  </Button>
                  <Button onClick={handleConfirmOther} size="sm" variant="secondary" className="flex-1">
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
