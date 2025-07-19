
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { ArrowLeft, Clipboard, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

const RecordProduction = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productionOrders, getProductionOrderById, completeProductionOrder, updateProductionOrderStatus, fetchProductionOrders } = useManufacturing();
  const { items } = useInventory();
  
  const [laborCost, setLaborCost] = useState<number>(0);
  const [additionalCosts, setAdditionalCosts] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [productionOrder, setProductionOrder] = useState<any>(null);
  
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          // First check if we already have the order in state
          const existingOrder = getProductionOrderById(id);
          
          if (existingOrder) {
            setProductionOrder(existingOrder);
            setLaborCost(existingOrder.laborCost || 0);
            setAdditionalCosts(existingOrder.additionalCosts || 0);
            setIsLoading(false);
          } else {
            // If not found, fetch fresh data
            await fetchProductionOrders(true);
          }
        } catch (error) {
          console.error("Error fetching production orders:", error);
          toast.error("Error loading production order");
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [id, fetchProductionOrders, getProductionOrderById]);
  
  useEffect(() => {
    if (id && productionOrders.length > 0 && !productionOrder) {
      const order = getProductionOrderById(id);
      if (order) {
        setProductionOrder(order);
        setLaborCost(order.laborCost || 0);
        setAdditionalCosts(order.additionalCosts || 0);
        setIsLoading(false);
      } else {
        toast.error('Production order not found');
        navigate('/manufacturing/production');
      }
    }
  }, [id, getProductionOrderById, navigate, productionOrders, productionOrder]);

  const handleStartProduction = async () => {
    if (!id) return;
    
    setIsProcessing(true);
    try {
      await updateProductionOrderStatus(id, 'in-progress');
      setProductionOrder({
        ...productionOrder,
        status: 'in-progress'
      });
      toast.success('Production started successfully');
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error('Failed to start production');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteProduction = async () => {
    if (!id) return;
    
    setIsProcessing(true);
    try {
      await completeProductionOrder(id, laborCost, additionalCosts);
      toast.success('Production recorded successfully');
      navigate('/manufacturing/production');
    } catch (error) {
      console.error('Error completing production:', error);
      toast.error('Failed to complete production');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !productionOrder) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-[50vh]">
            <p>Loading production order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/manufacturing/production')} 
            className="h-8 w-8 mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Record Production</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Batch ID</Label>
                <p className="font-medium">{productionOrder.batchId || 'N/A'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Product</Label>
                <p className="font-medium">{productionOrder.bom?.productName || 'N/A'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Quantity to Produce</Label>
                <p className="font-medium">{productionOrder.quantityToProduce}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">{format(new Date(productionOrder.startDate), 'MMM d, yyyy')}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{productionOrder.status}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record Production</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {productionOrder.status === 'planned' && (
                <div className="mb-6">
                  <Button 
                    onClick={handleStartProduction} 
                    className="w-full" 
                    disabled={isProcessing}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Starting Production...' : 'Start Production'}
                  </Button>
                </div>
              )}
              
              {(productionOrder.status === 'in-progress' || productionOrder.status === 'in_progress') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={laborCost}
                      onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additionalCosts">Additional Costs</Label>
                    <Input
                      id="additionalCosts"
                      type="number"
                      min="0"
                      step="0.01"
                      value={additionalCosts}
                      onChange={(e) => setAdditionalCosts(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any production notes here..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCompleteProduction} 
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Completing Production...' : 'Complete Production'}
                  </Button>
                </>
              )}
              
              {productionOrder.status === 'completed' && (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p>This production order has been completed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RecordProduction;
