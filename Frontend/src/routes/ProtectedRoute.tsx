
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, checkAccess } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If roles are specified and user doesn't have permission
  if (allowedRoles.length > 0 && !checkAccess(allowedRoles)) {
    toast.error("You don't have permission to access this section");
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute;
