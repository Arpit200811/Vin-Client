// import { useState, useRef, useEffect } from "react";
// import { Button } from "../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { useToast } from "../hooks/use-toast";
// import { initializeCamera, stopCamera } from "../lib/camera";
// import { performOCR } from "../lib/ocr";
// import { validateVIN } from "../lib/vin-validator";

// export default function CameraScanner({ onVinDetected }: { onVinDetected: (vin: string) => void }) {
//   const [isCameraActive, setIsCameraActive] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [scanProgress, setScanProgress] = useState(0);
//   const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const { toast } = useToast();

//   const handleCaptureFrame = async () => {
//     if (!isCameraActive || !videoRef.current) {
//       toast({ title: "Camera inactive", variant: "destructive" });
//       return;
//     }

//     setIsScanning(true);
//     setScanProgress(0);

//     try {
//       const canvas = document.createElement("canvas");
//       const video = videoRef.current!;
//       canvas.width = 400; // crop width
//       canvas.height = 80; // crop height
//       const ctx = canvas.getContext("2d")!;

//       // Draw only center rectangle (VIN area)
//       ctx.drawImage(
//         video,
//         video.videoWidth / 2 - 200, // x start
//         video.videoHeight / 2 - 40, // y start
//         400, 80,                     // width, height
//         0, 0,                        // canvas dest x,y
//         400, 80                      // canvas dest width, height
//       );

//       // Simulate scan progress
//       for (let i = 0; i <= 100; i += 20) {
//         setScanProgress(i);
//         await new Promise(res => setTimeout(res, 100));
//       }

//       const extractedText = await performOCR(canvas);
//       const validVin = validateVIN(extractedText);

//       if (validVin) {
//         onVinDetected(validVin); // opens VinForm
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
//       <CardHeader>
//         <CardTitle className="flex items-center justify-between">
//           Live VIN Scanner
//           {isCameraActive && (
//             <span className="flex items-center space-x-2 text-green-600 font-medium">
//               <span className="flex h-3 w-3 relative">
//                 <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
//                 <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
//               </span>
//               Camera Active
//             </span>
//           )}
//         </CardTitle>
//       </CardHeader>
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
//               {/* Center rectangle overlay */}
//               {isCameraActive && (
//                 <div className="absolute border-2 border-yellow-400 w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
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
//             {isScanning && (
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="flex items-center justify-between text-sm mb-1">
//                   <span className="text-gray-600">Scan Progress</span>
//                   <span className="text-gray-600">{scanProgress}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }



import { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { initializeCamera, stopCamera } from "../lib/camera";
import { performOCR } from "../lib/ocr";

export default function CameraScanner({ onVinDetected }: { onVinDetected: (vin: string) => void }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const handleCaptureFrame = async () => {
    if (!isCameraActive || !videoRef.current) {
      toast({ title: "Camera inactive", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current!;
      canvas.width = 400;
      canvas.height = 80;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(
        video,
        video.videoWidth / 2 - 200,
        video.videoHeight / 2 - 40,
        400, 80,
        0, 0,
        400, 80
      );

      for (let i = 0; i <= 100; i += 20) {
        setScanProgress(i);
        await new Promise(res => setTimeout(res, 100));
      }

      const extractedText = await performOCR(canvas);
      const vinText = extractedText.trim().toUpperCase();

      if (vinText.length >= 11) {
        onVinDetected(vinText);
        toast({ title: "VIN Detected", description: `VIN: ${vinText}` });
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
                </div>
              )}
              {isCameraActive && (
                <div className="absolute border-2 border-yellow-400 w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              )}
            </div>

            <div className="flex justify-center mt-4 space-x-3">
              <Button onClick={handleToggleCamera} disabled={isScanning}>
                {isCameraActive ? "Stop Camera" : "Start Camera"}
              </Button>
              <Button onClick={handleSwitchCamera} disabled={!isCameraActive || isScanning} variant="outline">
                Switch Camera
              </Button>
              <Button onClick={handleCaptureFrame} disabled={!isCameraActive || isScanning} variant="secondary">
                {isScanning ? "Scanning..." : "Capture"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {isScanning && (
              <div className="bg-gray-50 rounded-lg p-4">
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
        </div>
      </CardContent>
    </Card>
  );
}
