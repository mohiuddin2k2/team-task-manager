import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import { getStoredUser } from "./utils/auth";
import { applyTheme, getInitialTheme } from "./utils/theme";

function ProtectedRoute({ children }) {
  const user = getStoredUser();
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
