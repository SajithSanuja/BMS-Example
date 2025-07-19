
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import SettingsPage from "@/pages/settings/SettingsPage";

const SettingsRoutes = (
  <Route path="/settings" element={
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  } />
);

export default SettingsRoutes;
