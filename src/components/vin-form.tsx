import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { getCurrentLocation } from "../lib/geolocation";
import { isUnauthorizedError } from "../lib/authUtils";
import { BASE_URL } from '../lib/Service';

const vinFormSchema = z.object({
  vinNumber: z.string().min(11, "VIN must be at least 11 characters"),
  userName: z.string().min(1, "Name is required"),
  userIdField: z.string().min(1, "User ID is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleColor: z.string().min(1, "Vehicle color is required"),
});

type VinFormData = z.infer<typeof vinFormSchema>;

interface VinFormProps {
  detectedVin: string;
  onScanSaved: () => void;
  mode?: "checkin" | "checkout";
  checkoutData?: any;
}

const COLOR_OPTIONS = [
  "black","white","silver","gray","blue","red","green","yellow","brown","gold","orange","purple","beige","maroon","other"
];

export default function VinForm({ detectedVin, onScanSaved, mode = "checkin", checkoutData }: VinFormProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [scanTimestamp] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultValues = {
    vinNumber: detectedVin || "",
    userName: checkoutData?.userName || "",
    userIdField: checkoutData?.userIdField || "",
    mobileNumber: checkoutData?.mobileNumber || "",
    vehicleModel: checkoutData?.vehicleModel || "",
    vehicleColor: checkoutData?.vehicleColor || "",
  };

  const form = useForm<VinFormData>({
    resolver: zodResolver(vinFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (checkoutData) {
      form.reset({
        vinNumber: checkoutData.vinNumber || "",
        userName: checkoutData.userName || "",
        userIdField: checkoutData.userIdField || "",
        mobileNumber: checkoutData.mobileNumber || "",
        vehicleModel: checkoutData.vehicleModel || "",
        vehicleColor: checkoutData.vehicleColor || "",
      });
    } else {
      form.setValue("vinNumber", detectedVin || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutData, detectedVin]);

  useEffect(() => {
    getCurrentLocation()
      .then(setLocation)
      .catch(() => {
        toast({
          title: "Location Access",
          description: "Could not get current location. Proceeding without location data.",
          variant: "destructive",
        });
      });
  }, [toast]);

  const saveScanMutation = useMutation({
    mutationFn: async (data: VinFormData) => {
      const scanData = {
        ...data,
        materialConfirmed: false,
        scanStatus: "complete",
        ...(location && {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        }),
      };
      await apiRequest("POST", `http://localhost:5000/api/scans`, scanData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "VIN scan saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["userScans"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      onScanSaved();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to save VIN scan. Please try again.", variant: "destructive" });
    },
  });

  const onSubmit = (data: VinFormData) => saveScanMutation.mutate(data);

  const isCheckout = mode === "checkout";
  const isCheckin = mode === "checkin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>VIN Scan Details</CardTitle>
      </CardHeader>

      {/* make sure dropdown won't be clipped by parent */}
      <CardContent className="overflow-visible">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* VIN Number */}
            <FormField control={form.control} name="vinNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Detected VIN Number</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-gray-50 font-mono text-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* User Name */}
            <FormField control={form.control} name="userName" render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={isCheckout} className={isCheckout ? "bg-gray-50" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* User ID */}
            <FormField control={form.control} name="userIdField" render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={isCheckout && !isCheckin} className={isCheckin ? "bg-gray-50" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Mobile Number */}
            <FormField control={form.control} name="mobileNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={isCheckout && !isCheckin} className={isCheckout ? "bg-gray-50" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Vehicle Model */}
            <FormField control={form.control} name="vehicleModel" render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Model</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={isCheckout && !isCheckin} className={isCheckout ? "bg-gray-50" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ====== Vehicle Color (native select to avoid overlap issues) ====== */}
            <FormField control={form.control} name="vehicleColor" render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Color</FormLabel>
                <FormControl>
                  <select
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isCheckout && !isCheckin}
                    className={`w-full p-2 border rounded ${isCheckout ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    aria-label="Vehicle Color"
                  >
                    <option value="">Select color</option>
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Auto-detected Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-detected Information</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-600">Scan Date & Time:</span> <span className="ml-2 font-medium">{scanTimestamp.toLocaleString()}</span></div>
                <div><span className="text-gray-600">Location:</span> <span className="ml-2 font-medium">{location ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : "Location not available"}</span></div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onScanSaved}>Cancel</Button>
              <Button type="submit" disabled={saveScanMutation.isPending}>{saveScanMutation.isPending ? "Saving..." : "Save VIN Scan"}</Button>
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
