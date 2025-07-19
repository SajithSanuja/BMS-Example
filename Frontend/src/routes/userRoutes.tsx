
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import UserManagementPage from "@/pages/users/UserManagementPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import { UserRole } from "@/types";

const UserRoutes = (
  <Route path="/">
    <Route path="users" element={
      <ProtectedRoute allowedRoles={["manager" as UserRole]}>
        <UserManagementPage />
      </ProtectedRoute>
    } />
    <Route path="profile" element={
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    } />
  </Route>
);

export default UserRoutes;
