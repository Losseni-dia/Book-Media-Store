import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/context/AuthContext";

/**
 * Restricts child routes to authenticated users whose profile includes the ADMIN role.
 */
const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Chargement de la session…
      </div>
    );
  }

  const isAdmin = user?.role?.includes("ADMIN");
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default AdminRoute;
