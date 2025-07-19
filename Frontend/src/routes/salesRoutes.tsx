
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import SalesPage from "@/pages/sales/SalesPage";
import CustomerList from "@/pages/sales/customers/CustomerList";
import CustomerForm from "@/pages/sales/customers/CustomerForm";
import POSPage from "@/pages/sales/pos/POSPage";
import SalesOrderList from "@/pages/sales/orders/SalesOrderList";
import CreateSalesOrder from "@/pages/sales/orders/CreateSalesOrder";
import SalesOrderDetail from "@/pages/sales/orders/SalesOrderDetail";
import SalesReturnsPage from "@/pages/sales/returns/SalesReturnsPage";
import SalesReportsPage from "@/pages/sales/reports/SalesReportsPage";

const SalesRoutes = (
  <Route path="/sales">
    <Route index element={
      <ProtectedRoute>
        <SalesPage />
      </ProtectedRoute>
    } />
    <Route path="customers" element={
      <ProtectedRoute>
        <CustomerList />
      </ProtectedRoute>
    } />
    <Route path="customers/new" element={
      <ProtectedRoute>
        <CustomerForm />
      </ProtectedRoute>
    } />
    <Route path="customers/:id" element={
      <ProtectedRoute>
        <CustomerForm />
      </ProtectedRoute>
    } />
    <Route path="orders" element={
      <ProtectedRoute>
        <SalesOrderList />
      </ProtectedRoute>
    } />
    <Route path="orders/new" element={
      <ProtectedRoute>
        <CreateSalesOrder />
      </ProtectedRoute>
    } />
    <Route path="orders/:id" element={
      <ProtectedRoute>
        <SalesOrderDetail />
      </ProtectedRoute>
    } />
    <Route path="pos" element={
      <ProtectedRoute>
        <POSPage />
      </ProtectedRoute>
    } />
    <Route path="returns" element={
      <ProtectedRoute>
        <SalesReturnsPage />
      </ProtectedRoute>
    } />
    <Route path="reports" element={
      <ProtectedRoute>
        <SalesReportsPage />
      </ProtectedRoute>
    } />
  </Route>
);

export default SalesRoutes;
