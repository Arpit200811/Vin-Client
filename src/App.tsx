import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./hooks/useAuth";
import axios from "axios";
import Landing from "./pages/landing";
import Scanner from "./pages/scanner";
import Admin from "./pages/admin";
import Login from "./pages/login";
import NotFound from "./pages/not-found";
import Signup from "./pages/Signup";

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <AuthSpinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      {!isAuthenticated && (
        <>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      {/* Protected Routes */}
      {isAuthenticated && (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/admin"
            element={user?.role === "admin" ? <Admin /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router>
        <AppRouter />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
