import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-search text-white text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VIN Detector</h1>
              <p className="text-gray-600">
                Professional Vehicle Identification System
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Scan VIN numbers with advanced camera technology and OCR processing
              </p>
              
              <Button 
                onClick={() => navigate("/login")}
                className="w-full"
                data-testid="button-login"
              >
                Sign In to Continue
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
              <div>
                <i className="fas fa-camera text-primary mb-1 block"></i>
                Live Scanning
              </div>
              <div>
                <i className="fas fa-shield-alt text-primary mb-1 block"></i>
                Secure Storage
              </div>
              <div>
                <i className="fas fa-chart-bar text-primary mb-1 block"></i>
                Analytics
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
