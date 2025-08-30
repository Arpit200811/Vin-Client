// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { z } from "zod";
// import { Button } from "../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
// import { Input } from "../components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
// import { useToast } from "../hooks/use-toast";
// import { apiRequest } from "../lib/queryClient";
// import { getCurrentLocation } from "../lib/geolocation";
// import { isUnauthorizedError } from "../lib/authUtils";

// const vinFormSchema = z.object({
//   vinNumber: z.string().length(17, "VIN must be exactly 17 characters"),
//   userName: z.string().min(1, "Name is required"),
//   userIdField: z.string().min(1, "User ID is required"),
//   mobileNumber: z.string().min(10, "Valid mobile number is required"),
//   vehicleModel: z.string().min(1, "Vehicle model is required"),
//   vehicleColor: z.string().min(1, "Vehicle color is required"),
// });

// type VinFormData = z.infer<typeof vinFormSchema>;

// interface VinFormProps {
//   detectedVin: string;
//   onScanSaved: () => void;
// }

// export default function VinForm({ detectedVin, onScanSaved }: VinFormProps) {
//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [scanTimestamp] = useState(new Date());
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const form = useForm<VinFormData>({
//     resolver: zodResolver(vinFormSchema),
//     defaultValues: {
//       vinNumber: detectedVin,
//       userName: "",
//       userIdField: "",
//       mobileNumber: "",
//       vehicleModel: "",
//       vehicleColor: "",
//     },
//   });

//   useEffect(() => {
//     form.setValue("vinNumber", detectedVin);
//   }, [detectedVin, form]);

//   useEffect(() => {
//     getCurrentLocation()
//       .then(setLocation)
//       .catch(() => {
//         toast({
//           title: "Location Access",
//           description: "Could not get current location. Proceeding without location data.",
//           variant: "destructive",
//         });
//       });
//   }, [toast]);

//   const saveScanMutation = useMutation({
//     mutationFn: async (data: VinFormData) => {
//       const scanData = {
//         ...data,
//         materialConfirmed: true,
//         scanStatus: "complete",
//         ...(location && {
//           latitude: location.latitude.toString(),
//           longitude: location.longitude.toString(),
//         }),
//       };
      
//       await apiRequest("POST", "http://127.0.0.1:5000/api/scans", scanData);
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "VIN scan saved successfully!",
//       });
//       queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
//       queryClient.invalidateQueries({ queryKey: ["/api/stats/user"] });
//       onScanSaved();
//     },
//     onError: (error) => {
//       if (isUnauthorizedError(error)) {
//         toast({
//           title: "Unauthorized",
//           description: "You are logged out. Logging in again...",
//           variant: "destructive",
//         });
//         setTimeout(() => {
//           window.location.href = "/api/login";
//         }, 500);
//         return;
//       }
//       toast({
//         title: "Error",
//         description: "Failed to save VIN scan. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   const onSubmit = (data: VinFormData) => {
//     saveScanMutation.mutate(data);
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>VIN Scan Details</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             {/* Detected VIN */}
//             <FormField
//               control={form.control}
//               name="vinNumber"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Detected VIN Number</FormLabel>
//                   <div className="relative">
//                     <FormControl>
//                       <Input 
//                         {...field} 
//                         readOnly 
//                         className="bg-gray-50 font-mono text-lg"
//                         data-testid="input-detected-vin"
//                       />
//                     </FormControl>
//                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                       <i className="fas fa-check-circle text-green-500"></i>
//                     </div>
//                   </div>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <div className="grid md:grid-cols-2 gap-6">
//               {/* User Information */}
//               <FormField
//                 control={form.control}
//                 name="userName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>User Name</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="Enter your name" 
//                         {...field} 
//                         data-testid="input-user-name"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="userIdField"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>User ID</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="Enter your ID" 
//                         {...field} 
//                         data-testid="input-user-id"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="mobileNumber"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Mobile Number</FormLabel>
//                     <FormControl>
//                       <Input 
//                         type="tel" 
//                         placeholder="Enter mobile number" 
//                         {...field} 
//                         data-testid="input-mobile"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="vehicleModel"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Vehicle Model</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="e.g., Honda Civic 2018" 
//                         {...field} 
//                         data-testid="input-vehicle-model"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="vehicleColor"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Vehicle Color</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger data-testid="select-vehicle-color">
//                           <SelectValue placeholder="Select color" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="black">Black</SelectItem>
//                         <SelectItem value="white">White</SelectItem>
//                         <SelectItem value="silver">Silver</SelectItem>
//                         <SelectItem value="blue">Blue</SelectItem>
//                         <SelectItem value="red">Red</SelectItem>
//                         <SelectItem value="gray">Gray</SelectItem>
//                         <SelectItem value="other">Other</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* Auto-populated Information */}
//             <div className="bg-gray-50 rounded-lg p-4">
//               <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-detected Information</h4>
//               <div className="grid md:grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <span className="text-gray-600">Scan Date & Time:</span>
//                   <span className="ml-2 font-medium" data-testid="text-scan-timestamp">
//                     {scanTimestamp.toLocaleString()}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-gray-600">Location:</span>
//                   <span className="ml-2 font-medium" data-testid="text-location">
//                     {location 
//                       ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
//                       : "Location not available"
//                     }
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Submit Buttons */}
//             <div className="flex justify-end space-x-3">
//               <Button 
//                 type="button" 
//                 variant="outline"
//                 onClick={onScanSaved}
//                 data-testid="button-cancel"
//               >
//                 Cancel
//               </Button>
//               <Button 
//                 type="submit" 
//                 disabled={saveScanMutation.isPending}
//                 data-testid="button-save-scan"
//               >
//                 <i className="fas fa-save mr-2"></i>
//                 {saveScanMutation.isPending ? "Saving..." : "Save VIN Scan"}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </CardContent>
//     </Card>
//   );
// }




import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { getCurrentLocation } from "../lib/geolocation";
import { isUnauthorizedError } from "../lib/authUtils";
import {BASE_URL} from '../lib/Service'

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
}

export default function VinForm({ detectedVin, onScanSaved }: VinFormProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [scanTimestamp] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VinFormData>({
    resolver: zodResolver(vinFormSchema),
    defaultValues: {
      vinNumber: detectedVin,
      userName: "",
      userIdField: "",
      mobileNumber: "",
      vehicleModel: "",
      vehicleColor: "",
    },
  });

  useEffect(() => {
    form.setValue("vinNumber", detectedVin);
  }, [detectedVin, form]);

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
        materialConfirmed: false, // Manual check later
        scanStatus: "pending",
        ...(location && {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        }),
      };
      await apiRequest("POST", `${BASE_URL}/api/scans`, scanData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "VIN scan saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["userScans"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      onScanSaved();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save VIN scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VinFormData) => {
    saveScanMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>VIN Scan Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="vinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detected VIN Number</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-gray-50 font-mono text-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="userName" render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="userIdField" render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vehicleModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Honda Civic 2018" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vehicleColor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Color</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-detected Information</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Scan Date & Time:</span>
                  <span className="ml-2 font-medium">{scanTimestamp.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">
                    {location ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : "Location not available"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onScanSaved}>Cancel</Button>
              <Button type="submit" disabled={saveScanMutation.isPending}>
                {saveScanMutation.isPending ? "Saving..." : "Save VIN Scan"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

