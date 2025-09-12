// import { useState, useRef, useEffect } from "react";
// import Webcam from "react-webcam";
// import * as tmImage from "@teachablemachine/image";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import VinForm from "./vin-form";
// import { BASE_URL } from "../lib/Service";

// export default function VinScanner() {
//   const webcamRef = useRef<Webcam>(null);
//   const [isCameraActive, setIsCameraActive] = useState(false);
//   const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
//   const [predictions, setPredictions] = useState<
//     Array<{ className: string; probability: number }>
//   >([]);
//   const [isScanning, setIsScanning] = useState(false);
//   const [facingMode, setFacingMode] = useState<"user" | "environment">(
//     "environment"
//   );
//   const [mode, setMode] = useState<"checkin" | "checkout" | null>(null);

//   // Check-In / Check-Out states
//   const [detectedVin, setDetectedVin] = useState<string | null>(null);
//   const [showCheckInForm, setShowCheckInForm] = useState(false);
//   const [checkoutData, setCheckoutData] = useState<any>(null);
//   const [showCheckoutForm, setShowCheckoutForm] = useState(false);

//   const MODEL_URL = "https://teachablemachine.withgoogle.com/models/E2_QPc8m4/";

//   // Load Teachable Machine model
//   useEffect(() => {
//     const loadModel = async () => {
//       try {
//         const loadedModel = await tmImage.load(
//           MODEL_URL + "model.json",
//           MODEL_URL + "metadata.json"
//         );
//         setModel(loadedModel);
//         toast.success("Model loaded ✅");
//       } catch (err) {
//         console.error(err);
//         toast.error("Model failed to load!");
//       }
//     };
//     loadModel();
//   }, []);

//   // Capture & predict
//   const handleCapture = async () => {
//     if (!webcamRef.current || !model) return toast.error("Camera/model not ready!");

//     const screenshotBase64 = webcamRef.current.getScreenshot();
//     if (!screenshotBase64) return toast.error("Screenshot failed!");

//     const img = new Image();
//     img.src = screenshotBase64;

//     img.onload = async () => {
//       const rectWidth = 400;
//       const rectHeight = 80;
//       const canvas = document.createElement("canvas");
//       canvas.width = rectWidth;
//       canvas.height = rectHeight;
//       const ctx = canvas.getContext("2d");
//       if (!ctx) return toast.error("Canvas error");

//       const sx = img.width / 2 - rectWidth / 2;
//       const sy = img.height / 2 - rectHeight / 2;
//       ctx.drawImage(img, sx, sy, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);

//       try {
//         const prediction = await model.predict(canvas);
//         setPredictions(prediction);

//         const topPrediction = prediction.reduce((prev, curr) =>
//           prev.probability > curr.probability ? prev : curr
//         );

//         const classNameLower = topPrediction.className.toLowerCase();
//         const probability = topPrediction.probability;

//         if (classNameLower.includes("paper") && probability >= 0.9) {
//           toast.warning(`VIN on Paper ❌ (${(probability * 100).toFixed(2)}%)`);
//           setIsScanning(false);
//           return;
//         }

//         setIsScanning(true);
//         canvas.toBlob(async (blob) => {
//           if (!blob) return toast.error("Blob creation failed");

//           try {
//             const formData = new FormData();
//             formData.append("image", blob, "vin_metal.jpg");

//             // Send to backend to get VIN
//             const vinResponse = await axios.post(
//               `${BASE_URL}/api/scan-vin`,
//               formData,
//               { headers: { "Content-Type": "multipart/form-data" } }
//             );

//             const vinScan = vinResponse.data.vin;
//             if (!vinScan) return toast.error("VIN scan failed");

//             if (mode === "checkin") {
//               setDetectedVin(vinScan);
//               setShowCheckInForm(true);
//               toast.success(`VIN detected ✅ ${vinScan}`);
//             }

//             if (mode === "checkout") {
//               const vinDetails = await axios.get(
//                 `${BASE_URL}/get-vin-details/${vinScan}`
//               );
//               setCheckoutData(vinDetails.data);
//               setShowCheckoutForm(true);
//               toast.success("VIN details fetched ✅");
//             }
//           } catch (err) {
//             console.error(err);
//             toast.error(`${mode === "checkin" ? "Check-In" : "Check-Out"} failed`);
//           } finally {
//             setIsScanning(false);
//           }
//         }, "image/jpeg", 0.95);
//       } catch (err) {
//         console.error(err);
//         toast.error("Prediction failed!");
//         setIsScanning(false);
//       }
//     };
//   };

//   const handleSwitchCamera = () => {
//     setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
//   };

//   return (
//     <div className="flex flex-col items-center p-4 space-y-4 w-full max-w-lg mx-auto">
//       {/* Camera */}
//       {isCameraActive && (
//         <div className="relative w-full max-w-md">
//           <Webcam
//             ref={webcamRef}
//             audio={false}
//             screenshotFormat="image/jpeg"
//             videoConstraints={{ facingMode }}
//             className="w-full h-auto rounded-lg border shadow"
//           />
//           <div className="absolute border-2 border-yellow-400 w-[90%] max-w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md"></div>
//         </div>
//       )}

//       {/* Buttons */}
//       <div className="flex flex-wrap justify-center gap-2">
//         {mode !== "checkout" && !showCheckInForm && (
//           <button
//             onClick={() => { setMode("checkin"); setIsCameraActive(true); }}
//             disabled={isScanning}
//             className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition disabled:opacity-50"
//           >
//             VIN Check-In
//           </button>
//         )}

//         {mode !== "checkin" && !showCheckoutForm && (
//           <button
//             onClick={() => { setMode("checkout"); setIsCameraActive(true); }}
//             disabled={isScanning}
//             className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 transition disabled:opacity-50"
//           >
//             VIN Check-Out
//           </button>
//         )}

//         {isCameraActive && (
//           <button
//             onClick={handleSwitchCamera}
//             className="px-4 py-2 bg-purple-500 text-white rounded-md shadow hover:bg-purple-600 transition"
//           >
//             Switch Camera
//           </button>
//         )}

//         {isCameraActive && !showCheckInForm && !showCheckoutForm && (
//           <button
//             onClick={handleCapture}
//             disabled={isScanning}
//             className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 transition disabled:opacity-50"
//           >
//             {isScanning ? "Scanning..." : "Capture & Predict"}
//           </button>
//         )}
//       </div>

//       {/* Check-In Form */}
//       {showCheckInForm && detectedVin && (
//         <VinForm
//           detectedVin={detectedVin}
//           onScanSaved={() => {
//             setShowCheckInForm(false);
//             setDetectedVin(null);
//             setMode(null);
//             setIsCameraActive(false);
//             toast.success("Check-In completed ✅");
//           }}
//         />
//       )}

//       {showCheckoutForm && checkoutData && (
//   <VinForm
//     detectedVin={checkoutData.vinNumber} // VIN for display
//     checkoutData={checkoutData}          // Pass entire fetched data
//     onScanSaved={() => {
//       setShowCheckoutForm(false);
//       setCheckoutData(null);
//       setMode(null);
//       setIsCameraActive(false);
//       toast.success("Check-Out completed ✅");
//     }}
//   />
// )}

//       {/* Predictions */}
//       {predictions.length > 0 && (
//         <div className="mt-4 w-full bg-gray-100 p-3 rounded-lg shadow">
//           <h3 className="font-medium mb-2 text-gray-700">Predictions:</h3>
//           {predictions.map((pred, idx) => (
//             <div key={idx} className="text-sm text-gray-800">
//               {pred.className}: {(pred.probability * 100).toFixed(2)}%
//             </div>
//           ))}
//         </div>
//       )}

//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// }







import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VinForm from "./vin-form";
import { BASE_URL } from "../lib/Service";

export default function VinScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [predictions, setPredictions] = useState<
    Array<{ className: string; probability: number }>
  >([]);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [mode, setMode] = useState<"checkin" | "checkout" | null>(null);

  // Torch state
  const [torchOn, setTorchOn] = useState(false);

  // Check-In / Check-Out states
  const [detectedVin, setDetectedVin] = useState<string | null>(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  //  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/PR7m1U5pc/";
  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/w1UvoFm_r/";

  // Load Teachable Machine model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tmImage.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );
        setModel(loadedModel);
        toast.success("Model loaded ✅");
      } catch (err) {
        console.error("Model load failed:", err);
        toast.error("Model failed to load!");
      }
    };
    loadModel();
  }, []);

  // **FIXED**: Torch is now handled using the webcam's own stream to avoid conflicts.
  const handleToggleTorch = async () => {
    if (webcamRef.current && webcamRef.current.stream) {
      const stream = webcamRef.current.stream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        try {
          const newTorchState = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: newTorchState }],
          } as any);
          setTorchOn(newTorchState);
        } catch (err) {
          console.error("Failed to toggle torch:", err);
          toast.error("Could not control the torch.");
        }
      } else {
        toast.warning("Torch not supported on this device/camera.");
      }
    } else {
      toast.error("Camera stream not available to control torch.");
    }
  };

  // Capture & predict
  const handleCapture = async () => {
    if (!webcamRef.current || !model) {
      return toast.error("Camera or model not ready!");
    }

    const screenshotBase64 = webcamRef.current.getScreenshot();
    if (!screenshotBase64) {
      return toast.error("Screenshot failed!");
    }

    const img = new Image();
    img.src = screenshotBase64;

    img.onload = async () => {
      const rectWidth = 400;
      const rectHeight = 80;
      const canvas = document.createElement("canvas");
      canvas.width = rectWidth;
      canvas.height = rectHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return toast.error("Canvas error");

      const sx = img.width / 2 - rectWidth / 2;
      const sy = img.height / 2 - rectHeight / 2;
      ctx.drawImage(img, sx, sy, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);

      try {
        const prediction = await model.predict(canvas);
        setPredictions(prediction);

        const topPrediction = prediction.reduce((prev, curr) =>
          prev.probability > curr.probability ? prev : curr
        );

        const classNameLower = topPrediction.className.toLowerCase();
        const probability = topPrediction.probability;

        if (classNameLower.includes("paper") && probability >= 0.9) {
          toast.warning(`VIN on Paper ❌ (${(probability * 100).toFixed(2)}%)`);
          return;
        }

        // **FIXED**: Corrected typo from "matel vin" to "metal vin"
        if (classNameLower.includes("metal vin") && probability >= 0.9) {
          toast.success(`Metal detected ✅ (${(probability * 100).toFixed(2)}%)`);
          setIsScanning(true);

          canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsScanning(false);
                return toast.error("Blob creation failed");
            }

            try {
              const formData = new FormData();
              formData.append("image", blob, "vin_metal.jpg");

              const vinResponse = await axios.post(
                `${BASE_URL}/api/scan-vin`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
              );

              const vinScan = vinResponse.data.vin;
              if (!vinScan) {
                  throw new Error("VIN not found in API response");
              }

              if (mode === "checkin") {
                setDetectedVin(vinScan);
                setShowCheckInForm(true);
                toast.success(`VIN detected ✅ ${vinScan}`);
              } else if (mode === "checkout") {
                const vinDetails = await axios.get(
                  `${BASE_URL}/get-vin-details/${vinScan}`
                );
                setCheckoutData(vinDetails.data);
                setShowCheckoutForm(true);
                toast.success("VIN details fetched ✅");
              }
            } catch (err) {
              console.error("API Error:", err);
              // **FIXED**: More accurate error message
              toast.error(`${mode === "checkin" ? "Check-In" : "Check-Out"} failed.Invalid Vin Number.`);
            } finally {
              setIsScanning(false);
            }
          }, "image/jpeg", 0.95);
        } else {
             toast.warning(`Low confidence: ${topPrediction.className} (${(probability * 100).toFixed(2)}%)`);
        }
      } catch (err) {
        console.error("Prediction error:", err);
        toast.error("Prediction failed!");
        setIsScanning(false);
      }
    };
  };

  const handleSwitchCamera = () => {
    setTorchOn(false); // Reset torch state when switching cameras
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleBack = () => {
    // Hide forms and go back to camera view
    if (showCheckInForm || showCheckoutForm) {
      setShowCheckInForm(false);
      setShowCheckoutForm(false);
      setDetectedVin(null);
      setCheckoutData(null);
    // Deactivate camera and go back to initial screen
    } else if (isCameraActive) {
      setIsCameraActive(false);
      setMode(null);
      setTorchOn(false);
      setPredictions([]);
    }
  };
  
  const showInitialButtons = !isCameraActive && !showCheckInForm && !showCheckoutForm;
  const showCameraControls = isCameraActive && !showCheckInForm && !showCheckoutForm;


  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-full max-w-lg mx-auto">
      {isCameraActive && (
        <div className="relative w-full max-w-md">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            className="w-full h-auto rounded-lg border shadow"
            onUserMedia={() => console.log("Webcam stream is ready.")} // Useful for debugging
          />
          <div className="absolute border-2 border-yellow-400 w-[90%] max-w-[400px] h-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md"></div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 w-full max-w-lg mt-3">
        {showInitialButtons && (
            <>
                <button
                    onClick={() => { setMode("checkin"); setIsCameraActive(true); }}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
                >
                    VIN Check-In
                </button>
                <button
                    onClick={() => { setMode("checkout"); setIsCameraActive(true); }}
                    className="px-3 py-2 text-sm bg-green-500 text-white rounded-md shadow hover:bg-green-600 transition"
                >
                    VIN Check-Out
                </button>
            </>
        )}

        {showCameraControls && (
            <>
                <button
                onClick={handleSwitchCamera}
                className="px-3 py-2 text-sm bg-purple-500 text-white rounded-md shadow hover:bg-purple-600 transition"
                >
                Switch
                </button>
                <button
                onClick={handleToggleTorch}
                className={`px-3 py-2 text-sm text-white rounded-md shadow transition ${torchOn ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                >
                Torch
                </button>
                <button
                onClick={handleCapture}
                disabled={isScanning}
                className="px-3 py-2 text-sm bg-cyan-500 text-white rounded-md shadow hover:bg-cyan-600 transition disabled:opacity-50"
                >
                {isScanning ? "..." : "Capture"}
                </button>
                <button
                onClick={handleBack}
                className="px-3 py-2 text-sm bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition"
                >
                Back
                </button>
            </>
        )}
      </div>

      {showCheckInForm && detectedVin && (
        <>
            <VinForm
            detectedVin={detectedVin}
            onScanSaved={() => {
                setShowCheckInForm(false);
                setDetectedVin(null);
                setMode(null);
                setIsCameraActive(false);
                toast.success("Check-In completed ✅");
            }}
            />
            <button onClick={handleBack} className="mt-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-md shadow hover:bg-gray-600 transition">Back to Camera</button>
        </>
      )}

      {showCheckoutForm && checkoutData && (
        <>
            <VinForm
            detectedVin={checkoutData.vinNumber}
            checkoutData={checkoutData}
            onScanSaved={() => {
                setShowCheckoutForm(false);
                setCheckoutData(null);
                setMode(null);
                setIsCameraActive(false);
                toast.success("Check-Out completed ✅");
            }}
            />
            <button onClick={handleBack} className="mt-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-md shadow hover:bg-gray-600 transition">Back to Camera</button>
        </>
      )}

      {predictions.length > 0 && !showCheckInForm && !showCheckoutForm && (
        <div className="mt-4 w-full bg-gray-100 p-3 rounded-lg shadow">
          <h3 className="font-medium mb-2 text-gray-700">Predictions:</h3>
          {predictions.map((pred, idx) => (
            <div key={idx} className="text-sm text-gray-800">
              {pred.className}: {(pred.probability * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}