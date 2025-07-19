
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ProcurementPage from "@/pages/procurement/ProcurementPage";
import PurchaseOrderList from "@/pages/procurement/orders/PurchaseOrderList";
import PurchaseOrderDetail from "@/pages/procurement/orders/PurchaseOrderDetail";
import CreatePurchaseOrder from "@/pages/procurement/orders/CreatePurchaseOrder";
import SupplierList from "@/pages/procurement/suppliers/SupplierList";
import SupplierForm from "@/pages/procurement/suppliers/SupplierForm";

const ProcurementRoutes = (
  <>
    <Route path="/procurement" element={
      <ProtectedRoute>
        <ProcurementPage />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/orders" element={
      <ProtectedRoute>
        <PurchaseOrderList />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/orders/new" element={
      <ProtectedRoute>
        <CreatePurchaseOrder />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/orders/:id" element={
      <ProtectedRoute>
        <PurchaseOrderDetail />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/suppliers" element={
      <ProtectedRoute>
        <SupplierList />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/suppliers/new" element={
      <ProtectedRoute>
        <SupplierForm />
      </ProtectedRoute>
    } />
    
    <Route path="/procurement/suppliers/:id/edit" element={
      <ProtectedRoute>
        <SupplierForm />
      </ProtectedRoute>
    } />
  </>
);

export default ProcurementRoutes;
