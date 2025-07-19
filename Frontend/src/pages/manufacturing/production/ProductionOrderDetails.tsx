
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { useFinancials } from '@/hooks/useFinancials';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types';

const ProductionOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { productionOrders, updateProductionOrderStatus, fetchProductionOrders } = useManufacturing();
  const { addTransaction } = useFinancials();
  const { items } = useInventory();
  
  const [productionOrder, setProductionOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        await fetchProductionOrders();
      };
      
      fetchData();
    }
  }, [id, fetchProductionOrders]);

  useEffect(() => {
    if (productionOrders.length > 0 && id) {
      const order = productionOrders.find(order => order.id === id);
      if (order) {
        setProductionOrder(order);
      } else {
        toast.error('Production order not found');
        navigate('/manufacturing/production');
      }
    }
  }, [productionOrders, id, navigate]);

  if (!productionOrder) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <p>Loading production order details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleMarkAsCompleted = async () => {
    try {
      setIsLoading(true);
      
      // Update production order status
      await updateProductionOrderStatus(productionOrder.id, 'completed');
      
      // Record the cost of production as an expense
      const totalCost = calculateTotalCost();
      await addTransaction(
        'expense',
        totalCost,
        'manufacturing',
        `Production Order: ${productionOrder.batchId || productionOrder.id}`,
        new Date(),
        'cash' as PaymentMethod,
        productionOrder.id
      );
      
      toast.success('Production order marked as completed');
      navigate('/manufacturing/production');
    } catch (error) {
      console.error('Error updating production order:', error);
      toast.error(`Failed to update production order: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalCost = () => {
    let materialCost = 0;
    
    // Calculate material costs
    if (productionOrder.bom && productionOrder.bom.materials) {
      materialCost = productionOrder.bom.materials.reduce((total, material) => {
        const item = items.find(i => i.id === material.itemId);
        if (item) {
          return total + (item.purchaseCost * material.quantity * productionOrder.quantityToProduce);
        }
        return total;
      }, 0);
    }
    
    // Add labor and additional costs
    const laborCost = productionOrder.laborCost || 0;
    const additionalCosts = productionOrder.additionalCosts || 0;
    
    return materialCost + laborCost + additionalCosts;
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Production Order Details</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/manufacturing/production')}
                >
                  Back to List
                </Button>
                {productionOrder.status === 'in-progress' && (
                  <Button 
                    onClick={handleMarkAsCompleted}
                    disabled={isLoading}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Production Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Production Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Batch ID:</span>
                    <span>{productionOrder.batchId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      productionOrder.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : productionOrder.status === 'in-progress' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {productionOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Start Date:</span>
                    <span>{new Date(productionOrder.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Completion Date:</span>
                    <span>{productionOrder.completionDate ? new Date(productionOrder.completionDate).toLocaleDateString() : 'Not completed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Quantity:</span>
                    <span>{productionOrder.quantityToProduce}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Cost Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Material Cost:</span>
                    <span>${calculateTotalCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Labor Cost:</span>
                    <span>${(productionOrder.laborCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Additional Costs:</span>
                    <span>${(productionOrder.additionalCosts || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Cost:</span>
                    <span>${(calculateTotalCost() + (productionOrder.laborCost || 0) + (productionOrder.additionalCosts || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* BOM Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Bill of Materials</h3>
              {productionOrder.bom ? (
                <>
                  <p className="mb-2"><span className="font-medium">Product:</span> {productionOrder.bom.productName}</p>
                  <p className="mb-4"><span className="font-medium">Description:</span> {productionOrder.bom.description || 'No description'}</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left">Material</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Unit</th>
                          <th className="px-4 py-2 text-right">Cost</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {productionOrder.bom.materials && productionOrder.bom.materials.map((material, index) => {
                          const item = items.find(i => i.id === material.itemId);
                          const cost = item ? item.purchaseCost : 0;
                          const totalCost = cost * material.quantity * productionOrder.quantityToProduce;
                          
                          return (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-2">{item?.name || 'Unknown Material'}</td>
                              <td className="px-4 py-2">{material.quantity * productionOrder.quantityToProduce}</td>
                              <td className="px-4 py-2">{material.unitOfMeasure}</td>
                              <td className="px-4 py-2 text-right">${cost.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">${totalCost.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No bill of materials information available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductionOrderDetails;
