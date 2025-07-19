
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import InventoryPage from "@/pages/inventory/InventoryPage";
import ItemManagement from "@/pages/inventory/items/ItemManagement";
import ItemForm from "@/pages/inventory/items/ItemForm";
import StockVisibility from "@/pages/inventory/stock/StockVisibility";
import Adjustments from "@/pages/inventory/adjustments/Adjustments";
import GoodsReceiptPage from "@/pages/inventory/goods-receipt/GoodsReceiptPage";
import ReturnsPage from "@/pages/inventory/returns/ReturnsPage";

const InventoryRoutes = (
  <>
    <Route path="/inventory" element={
      <ProtectedRoute>
        <InventoryPage />
      </ProtectedRoute>
    } />

    <Route path="/inventory/items" element={
      <ProtectedRoute>
        <ItemManagement />
      </ProtectedRoute>
    } />
    
    <Route path="/inventory/items/new" element={
      <ProtectedRoute>
        <ItemForm />
      </ProtectedRoute>
    } />
    
    <Route path="/inventory/items/:id/edit" element={
      <ProtectedRoute>
        <ItemForm />
      </ProtectedRoute>
    } />

    <Route path="/inventory/items/:id" element={
      <ProtectedRoute>
        <ItemManagement />
      </ProtectedRoute>
    } />

    <Route path="/inventory/stock" element={
      <ProtectedRoute>
        <StockVisibility />
      </ProtectedRoute>
    } />

    <Route path="/inventory/adjustments" element={
      <ProtectedRoute>
        <Adjustments />
      </ProtectedRoute>
    } />

    <Route path="/inventory/goods-receipt" element={
      <ProtectedRoute>
        <GoodsReceiptPage />
      </ProtectedRoute>
    } />

    <Route path="/inventory/returns" element={
      <ProtectedRoute>
        <ReturnsPage />
      </ProtectedRoute>
    } />
  </>
);

export default InventoryRoutes;
