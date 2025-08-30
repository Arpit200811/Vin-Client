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

// export default function Scanner() {
//   const { user } = useAuth();
//   const [detectedVin, setDetectedVin] = useState<string>("");
//   const [activeTab, setActiveTab] = useState<string>("scanner");

//   const { data: userStats } = useQuery({
//     queryKey: ["userStats"],
//     queryFn: () => apiRequest("GET", `${process.env.BASE_URL}/api/stats/user`),
//     enabled: !!user,
//   });

//   const { data: userScans } = useQuery({
//     queryKey: ["userScans"],
//     queryFn: () => apiRequest("GET", `${process.env.BASE_URL}/api/scans`),
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

export default function Scanner() {
  const { user } = useAuth();
  const [detectedVin, setDetectedVin] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("scanner");

  const { data: userStats } = useQuery({
    queryKey: ["userStats"],
    queryFn: () => apiRequest("GET", `${process.env.BASE_URL}/api/stats/user`),
    enabled: !!user,
  });

  const { data: userScans } = useQuery({
    queryKey: ["userScans"],
    queryFn: () => apiRequest("GET", `${process.env.BASE_URL}/api/scans`),
    enabled: !!user,
  });

  const handleVinDetected = (vin: string) => {
    setDetectedVin(vin);
  };

  const handleScanSaved = () => {
    setDetectedVin("");
    queryClient.invalidateQueries({ queryKey: ["userScans"] });
    queryClient.invalidateQueries({ queryKey: ["userStats"] });
    setActiveTab("scans");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner">VIN Scanner</TabsTrigger>
            <TabsTrigger value="scans">My Scans</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-8">
            <CameraScanner onVinDetected={handleVinDetected} />
            {detectedVin && (
              <VinForm
                detectedVin={detectedVin}
                onScanSaved={handleScanSaved}
              />
            )}
          </TabsContent>

          <TabsContent value="scans" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">My VIN Scans</h2>
            {userStats && <StatsCards stats={userStats} />}
            {Array.isArray(userScans) && (
              <ScanTable
                scans={userScans}
                showUserColumn={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
