import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Link, useLocation } from "wouter";
export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <i className="fas fa-search text-primary text-2xl mr-3"></i>
            <h1 className="text-xl font-bold text-gray-900">VIN Detector</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <a className={`font-medium ${location === "/" ? "text-primary" : "text-gray-700 hover:text-primary"}`}>
                Scanner
              </a>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <a className={`font-medium ${location === "/admin" ? "text-primary" : "text-gray-700 hover:text-primary"}`}>
                  Admin Panel
                </a>
              </Link>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}