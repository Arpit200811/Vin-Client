// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./hooks/useAuth";

// Import Pages
import Landing from "./pages/landing";
import Scanner from "./pages/scanner";
import Admin from "./pages/admin";
import NotFound from "./pages/not-found";

// A small component to show while authentication is loading
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
      {isAuthenticated ? (
        <>
          {/* Authenticated users land on the scanner page */}
          <Route path="/" element={<Scanner />} />
          
          {/* Admin Route */}
          <Route
            path="/admin"
            element={user?.role === "admin" ? <Admin /> : <Navigate to="/" replace />}
          />
          {/* If a logged-in user tries to visit a non-existent page */}
          <Route path="*" element={<NotFound />} />
        </>
      ) : (
        <>
          {/* Unauthenticated users land on the landing page */}
          <Route path="/" element={<Landing />} />

          {/* Any other route redirects to the landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
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