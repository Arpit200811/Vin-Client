import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient"; 
import Navigation from "../components/navigation";
import ScanTable from "../components/scan-table";
import StatsCards from "../components/stats-cards";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Navigate } from "react-router-dom";
type Scan = {
  id: string;
  vin: string;
  userId?: string;
  createdAt: string;
  status: "success" | "failed";
};

type AdminStats = {
  totalUsers: number;
  totalScans: number;
  todayScans: number;
  failedScans: number;
  successRate: number;
};

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // State for the filter input fields
  const [filterInputs, setFilterInputs] = useState({
    vinNumber: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });

  // State for the filters that are actually applied to the query
  const [appliedFilters, setAppliedFilters] = useState({});

  // Fetch admin stats
  const { data: adminStats = {} as AdminStats } = useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: () => apiRequest("GET", "http://127.0.0.1:5000/api/stats/admin"),
    enabled: !!user && user.role === "admin",
  });

  // Fetch all scans using the appliedFilters in the queryKey
  const { data: allScans = [] as Scan[] } = useQuery<Scan[]>({
    queryKey: ["allScans", appliedFilters],
    queryFn: () => {
      const params = new URLSearchParams(appliedFilters).toString();
      return apiRequest("GET", `http://127.0.0.1:5000/api/scans?${params}`);
    },
    enabled: !!user && user.role === "admin",
  });

  // Delete scan mutation
  const deleteScanMutation = useMutation({
    mutationFn: (scanId: string) => apiRequest("DELETE", `http://127.0.0.1:5000/api/scans/${scanId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scan deleted successfully",
      });
      // Invalidate the query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["allScans"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scan",
        variant: "destructive",
      });
    },
  });

  const handleApplyFilters = () => {
    // Remove empty filters before applying
    const cleanFilters = Object.fromEntries(
      Object.entries(filterInputs).filter(([_, v]) => v !== "")
    );
    setAppliedFilters(cleanFilters);
  };
  const handleDeleteScan = (scanId: string) => {
    // You can replace this with a styled AlertDialog from your component library
    if (window.confirm("Are you sure you want to delete this scan?")) {
      deleteScanMutation.mutate(scanId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use declarative routing for protection instead of useEffect with redirects
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
        
        {Object.keys(adminStats).length > 0 && <StatsCards stats={adminStats} />}

        <Card>
          <CardHeader><CardTitle>Filter & Search</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="vinNumber">Search VIN</Label>
                <Input
                  id="vinNumber"
                  placeholder="Enter VIN..."
                  value={filterInputs.vinNumber}
                  onChange={(e) => setFilterInputs({ ...filterInputs, vinNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filterInputs.dateFrom}
                  onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filterInputs.dateTo}
                  onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                />
              </div>
              <Button onClick={handleApplyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <ScanTable
          scans={allScans}
          showUserColumn={true}
          onDelete={handleDeleteScan}
          isAdmin={true}
        />
      </main>
    </div>
  );
}