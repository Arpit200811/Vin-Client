import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import type { VinScanWithUser } from "../../shared/schema";

interface ScanTableProps {
  scans?: VinScanWithUser[];   // <-- made optional, safer
  showUserColumn?: boolean;
  isAdmin?: boolean;
  onEdit: (scanId: string) => void;
  onDelete: (scanId: string) => void;
}

export default function ScanTable({ 
  scans = [],   // <-- default empty array (safety)
  showUserColumn = false, 
  isAdmin = false,
  onEdit, 
  onDelete 
}: ScanTableProps) {
  const [selectedScans, setSelectedScans] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScans(scans.map(scan => scan.id));
    } else {
      setSelectedScans([]);
    }
  };

  const handleSelectScan = (scanId: string, checked: boolean) => {
    if (checked) {
      setSelectedScans([...selectedScans, scanId]);
    } else {
      setSelectedScans(selectedScans.filter(id => id !== scanId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <i className="fas fa-check mr-1"></i>
            Complete
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <i className="fas fa-times mr-1"></i>
            Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary">
            <i className="fas fa-clock mr-1"></i>
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLocation = (latitude?: string, longitude?: string) => {
    if (!latitude || !longitude) return "Not available";
    return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{showUserColumn ? "All VIN Scans" : "Recent Scans"}</CardTitle>
        {isAdmin && selectedScans.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedScans.length} selected
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedScans.length} selected scans?`)) {
                  selectedScans.forEach(id => onDelete(id));
                  setSelectedScans([]);
                }
              }}
              data-testid="button-bulk-delete"
            >
              <i className="fas fa-trash mr-1"></i>
              Delete Selected
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedScans.length === scans.length && scans.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIN Number
                </th>
                {showUserColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scans.map((scan) => (
                <tr key={scan.id} data-testid={`row-scan-${scan.id}`}>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedScans.includes(scan.id)}
                        onCheckedChange={(checked) => handleSelectScan(scan.id, !!checked)}
                        data-testid={`checkbox-scan-${scan.id}`}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900" data-testid={`text-vin-${scan.id}`}>
                      {scan.vinNumber}
                    </div>
                  </td>
                  {showUserColumn && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-medium">
                            {scan.user.firstName?.[0]}{scan.user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900" data-testid={`text-user-name-${scan.id}`}>
                            {scan.user.firstName} {scan.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scan.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900" data-testid={`text-vehicle-model-${scan.id}`}>
                      {scan.vehicleModel}
                    </div>
                    <div className="text-sm text-gray-500 capitalize" data-testid={`text-vehicle-color-${scan.id}`}>
                      {scan.vehicleColor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`text-date-${scan.id}`}>
                    {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`text-location-${scan.id}`}>
                    {formatLocation(scan?.latitude,scan.longitude)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`status-${scan.id}`}>
                    {getStatusBadge(scan.scanStatus)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(scan.id)}
                        data-testid={`button-edit-${scan.id}`}
                      >
                        <i className="fas fa-edit text-primary"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(scan.id)}
                        data-testid={`button-delete-${scan.id}`}
                      >
                        <i className="fas fa-trash text-red-600"></i>
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td 
                    colSpan={isAdmin ? (showUserColumn ? 8 : 7) : (showUserColumn ? 6 : 5)} 
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <i className="fas fa-inbox text-gray-400 text-3xl"></i>
                      <span data-testid="text-no-scans">No scans found</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
