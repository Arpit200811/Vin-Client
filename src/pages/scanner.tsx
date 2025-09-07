// import { useState } from "react";
// import { useAuth } from "../hooks/useAuth";
// import { useQuery } from "@tanstack/react-query";
// import { apiRequest, queryClient } from "../lib/queryClient";
// import Navigation from "../components/navigation";
// import CameraScanner from "../components/camera-scanner";
// import VinForm from "../components/vin-form";
// import ScanTable from "../components/scan-table";
// import StatsCards from "../components/stats-cards";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
// import {BASE_URL} from '../lib/Service'

// export default function Scanner() {
//   const { user } = useAuth();
//   const [detectedVin, setDetectedVin] = useState<string>("");
//   const [activeTab, setActiveTab] = useState<string>("scanner");

//   const { data: userStats } = useQuery({
//     queryKey: ["userStats"],
//     queryFn: () => apiRequest("GET", `${BASE_URL}/api/stats/user`),
//     enabled: !!user,
//   });

//   const { data: userScans } = useQuery({
//     queryKey: ["userScans"],
//     queryFn: () => apiRequest("GET", `${BASE_URL}/api/scans`),
//     enabled: !!user,
//   });

//   const handleVinDetected = (vin: string) => {
//     setDetectedVin(vin);
//   };

//   const handleScanSaved = () => {
//     setDetectedVin("");
//     queryClient.invalidateQueries({ queryKey: ["userScans"] });
//     queryClient.invalidateQueries({ queryKey: ["userStats"] });
//     setActiveTab("scans");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navigation />

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
//           <TabsList className="grid w-full grid-cols-2">
//             <TabsTrigger value="scanner">VIN Scanner</TabsTrigger>
//             <TabsTrigger value="scans">My Scans</TabsTrigger>
//           </TabsList>

//           <TabsContent value="scanner" className="space-y-8">
//             <CameraScanner onVinDetected={handleVinDetected} />
//             {detectedVin && (
//               <VinForm
//                 detectedVin={detectedVin}
//                 onScanSaved={handleScanSaved}
//               />
//             )}
//           </TabsContent>

//           <TabsContent value="scans" className="space-y-6">
//             <h2 className="text-xl font-semibold text-gray-900">My VIN Scans</h2>
//             {userStats && <StatsCards stats={userStats} />}
//             {Array.isArray(userScans) && (
//               <ScanTable
//                 scans={userScans}
//                 showUserColumn={false}
//                 onEdit={() => {}}
//                 onDelete={() => {}}
//               />
//             )}
//           </TabsContent>
//         </Tabs>
//       </main>
//     </div>
//   );
// }



import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import Navigation from "../components/navigation";
import CameraScanner from "../components/camera-scanner";
import VinForm from "../components/vin-form";
import ScanTable from "../components/scan-table";
import StatsCards from "../components/stats-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BASE_URL } from "../lib/Service";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function Scanner() {
  const { user } = useAuth();
  const [detectedVin, setDetectedVin] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("scanner");

  // Fetch stats
  const { data: userStats } = useQuery({
    queryKey: ["userStats"],
    queryFn: () => apiRequest("GET", `${BASE_URL}/api/stats/user`),
    enabled: !!user,
  });

  // Fetch scans
  const { data: userScans } = useQuery({
    queryKey: ["userScans"],
    queryFn: () => apiRequest("GET", `${BASE_URL}/api/scans`),
    enabled: !!user,
  });

  // Handle VIN Detection
  const handleVinDetected = (vin: string) => {
    setDetectedVin(vin);

    Swal.fire({
      icon: "info",
      title: "VIN Detected 🚗",
      text: `We detected VIN: ${vin}`,
      confirmButtonColor: "#2563eb",
    });
  };

  // Handle Scan Save
  const handleScanSaved = () => {
    setDetectedVin("");
    queryClient.invalidateQueries({ queryKey: ["userScans"] });
    queryClient.invalidateQueries({ queryKey: ["userStats"] });
    setActiveTab("scans");

    Swal.fire({
      icon: "success",
      title: "Scan Saved ✅",
      text: "Your VIN scan has been successfully saved!",
      confirmButtonColor: "#16a34a",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 py-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-bold">VIN Scanner Dashboard</h1>
          <p className="mt-2 text-lg opacity-90">
            Scan, Save & Manage your Vehicle Identification Numbers effortlessly 🚀
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Rules & Regulations */}
        <section className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📌 Rules & Regulations
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Ensure camera has proper lighting while scanning.</li>
            <li>VIN must be clearly visible and not blurry.</li>
            <li>Do not share your scans with unauthorized users.</li>
            <li>Each scan will be logged with your account details.</li>
            <li>Report invalid or duplicate VINs immediately.</li>
          </ul>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow rounded-xl">
            <TabsTrigger 
              value="scanner" 
              className="text-sm sm:text-base py-3"
            >
              🚘 VIN Scanner
            </TabsTrigger>
            <TabsTrigger 
              value="scans" 
              className="text-sm sm:text-base py-3"
            >
              📑 My Scans
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
              <CameraScanner onVinDetected={handleVinDetected} />
              {detectedVin && (
                <VinForm detectedVin={detectedVin} onScanSaved={handleScanSaved} />
              )}
            </div>
          </TabsContent>

          {/* Scans Tab */}
          <TabsContent value="scans" className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📊 My VIN Scans
              </h2>
              {userStats && <StatsCards stats={userStats} />}
              {Array.isArray(userScans) && (
                <ScanTable
                  scans={userScans}
                  showUserColumn={false}
                  onEdit={() => {}}
                  onDelete={() => {
                    Swal.fire({
                      icon: "warning",
                      title: "Delete Scan?",
                      text: "Are you sure you want to delete this scan?",
                      showCancelButton: true,
                      confirmButtonColor: "#dc2626",
                      cancelButtonColor: "#6b7280",
                      confirmButtonText: "Yes, Delete",
                    });
                  }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

