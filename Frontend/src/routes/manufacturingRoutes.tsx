
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ManufacturingPage from "@/pages/manufacturing/ManufacturingPage";
import BOMList from "@/pages/manufacturing/bom/BOMList";
import BOMForm from "@/pages/manufacturing/bom/BOMForm";
import BOMDetails from "@/pages/manufacturing/bom/BOMDetails";
import ProductionOrderList from "@/pages/manufacturing/production/ProductionOrderList";
import CreateProductionOrder from "@/pages/manufacturing/production/CreateProductionOrder";
import ProductionOrderDetails from "@/pages/manufacturing/production/ProductionOrderDetails";
import ProductionLog from "@/pages/manufacturing/production-log/ProductionLog";
import RecordFinishedGoods from "@/pages/manufacturing/finished-goods/RecordFinishedGoods";
import RecordProduction from "@/pages/manufacturing/production/RecordProduction";

const ManufacturingRoutes = (
  <>
    <Route path="/manufacturing" element={
      <ProtectedRoute>
        <ManufacturingPage />
      </ProtectedRoute>
    } />
    
    {/* BOM Routes */}
    <Route path="/manufacturing/bom" element={
      <ProtectedRoute>
        <BOMList />
      </ProtectedRoute>
    } />
    
    <Route path="/manufacturing/bom/new" element={
      <ProtectedRoute>
        <BOMForm />
      </ProtectedRoute>
    } />
    
    <Route path="/manufacturing/bom/:id" element={
      <ProtectedRoute>
        <BOMDetails />
      </ProtectedRoute>
    } />
    
    <Route path="/manufacturing/bom/:id/edit" element={
      <ProtectedRoute>
        <BOMForm />
      </ProtectedRoute>
    } />
    
    {/* Production Order Routes */}
    <Route path="/manufacturing/production" element={
      <ProtectedRoute>
        <ProductionOrderList />
      </ProtectedRoute>
    } />
    
    <Route path="/manufacturing/production/new" element={
      <ProtectedRoute>
        <CreateProductionOrder />
      </ProtectedRoute>
    } />
    
    <Route path="/manufacturing/production/:id" element={
      <ProtectedRoute>
        <ProductionOrderDetails />
      </ProtectedRoute>
    } />
    
    {/* Add the missing Record Production route */}
    <Route path="/manufacturing/production/record/:id" element={
      <ProtectedRoute>
        <RecordProduction />
      </ProtectedRoute>
    } />
    
    {/* Production Log Route */}
    <Route path="/manufacturing/production-log" element={
      <ProtectedRoute>
        <ProductionLog />
      </ProtectedRoute>
    } />
    
    {/* Finished Goods Route */}
    <Route path="/manufacturing/finished-goods" element={
      <ProtectedRoute>
        <RecordFinishedGoods />
      </ProtectedRoute>
    } />
  </>
);

export default ManufacturingRoutes;
