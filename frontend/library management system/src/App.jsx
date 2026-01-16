import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Creator from "./pages/Creator";
import Admin from "./pages/Admin";
import User from "./pages/User";
import ReadBook from "./pages/Readbook"; // 🆕 Import the new Read Page
import { getAuth } from "./auth";

// Protected Route Wrapper
function ProtectedRoute({ children, role }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" />;
  if (role && auth.role !== role) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* General Dashboard (Redirects based on role usually handled in Navbar or component) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Role: Creator */}
      <Route path="/creator" element={
        <ProtectedRoute role="creator">
          <Creator />
        </ProtectedRoute>
      } />

      {/* Role: Admin */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <Admin />
        </ProtectedRoute>
      } />

      {/* Role: User (Library) */}
      <Route path="/user" element={
        <ProtectedRoute role="user">
          <User />
        </ProtectedRoute>
      } />

      {/* 🆕 Read Mode Route (Accessible to all logged-in users, ideally) */}
      <Route path="/read/:id" element={
        <ProtectedRoute>
          <ReadBook />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
