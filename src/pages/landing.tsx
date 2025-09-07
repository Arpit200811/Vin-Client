import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Shield, BarChart2, Search } from "lucide-react";
import Swal from "sweetalert2";

export default function Landing() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    Swal.fire({
      title: "Proceed to Login",
      text: "You’ll be redirected to the secure login page.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#9ca3af",
      background: "#ffffff",
      color: "#111827",
      backdrop: `rgba(0,0,0,0.5)`,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/login");
      }
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 p-4">
      {/* Animated Background Blobs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute w-[600px] h-[600px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse -top-20 -left-20"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse top-40 -right-20"
      />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl backdrop-blur-xl bg-white/80 rounded-3xl border border-white/40">
          <CardContent className="p-10 space-y-10">
            
            {/* Logo & Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Search className="text-white w-10 h-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                VIN Detector
              </h1>
              <p className="text-gray-500 text-sm">
                Professional Vehicle Identification System
              </p>
            </motion.div>

            {/* Description + Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <p className="text-center text-gray-600 text-sm leading-relaxed">
                Scan VIN numbers with advanced camera technology and OCR
                processing.  
                <span className="block mt-1 font-semibold text-gray-800">
                  Secure • Fast • Reliable
                </span>
              </p>

              <Button
                onClick={handleLoginClick}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold py-3 rounded-xl shadow-lg transition duration-300"
              >
                Sign In to Continue
              </Button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { delayChildren: 0.6, staggerChildren: 0.2 },
                },
              }}
              className="grid grid-cols-3 gap-6 text-center text-xs font-medium text-gray-600"
            >
              {[
                { icon: <Camera className="w-6 h-6" />, label: "Live Scan" },
                { icon: <Shield className="w-6 h-6" />, label: "Secure Data" },
                { icon: <BarChart2 className="w-6 h-6" />, label: "Analytics" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center space-y-2 cursor-default"
                >
                  <div className="text-blue-600">{item.icon}</div>
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
