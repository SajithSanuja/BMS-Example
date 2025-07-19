
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";

const AnalyticsRoutes = (
  <Route path="/analytics" element={
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  } />
);

export default AnalyticsRoutes;
