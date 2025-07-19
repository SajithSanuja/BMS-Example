
import { Route } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TestConnection from "@/pages/TestConnection";
import AuthTestPage from "@/pages/AuthTestPage";

const PublicRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/test-connection" element={<TestConnection />} />
    <Route path="/auth-test" element={<AuthTestPage />} />
  </>
);

export default PublicRoutes;
