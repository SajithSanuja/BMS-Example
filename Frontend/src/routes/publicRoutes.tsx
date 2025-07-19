
import { Route } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TestConnection from "@/pages/TestConnection";

const PublicRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/test-connection" element={<TestConnection />} />
  </>
);

export default PublicRoutes;
