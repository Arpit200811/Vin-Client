import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slice/authSlice";
import { RootState, persistor } from "../redux/store/store";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function Navigation() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    dispatch(logout());        
    await persistor.purge();   
    navigate("/login");
  };
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <i className="fas fa-search text-primary text-2xl mr-3"></i>
            <h1 className="text-xl font-bold text-gray-900">VIN Detector</h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/scanner"
              className={({ isActive }) =>
                `font-medium ${isActive ? "text-primary" : "text-gray-700 hover:text-primary"
                }`
              }
            >
              Scanner
            </NavLink>

            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `font-medium ${isActive
                    ? "text-primary"
                    : "text-gray-700 hover:text-primary"
                  }`
                }
              >
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* User Info + Logout */}
          <div className="flex items-center space-x-4">
            {user && (
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
            )}

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
