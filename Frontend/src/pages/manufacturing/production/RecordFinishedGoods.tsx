
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

const RecordFinishedGoods = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getProductionOrderById, updateProductionOrderStatus } = useManufacturing();
  const { adjustStock } = useInventory();
  
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productionOrder, setProductionOrder] = useState<any>(null);
  
  useEffect(() => {
    if (orderId) {
      const order = getProductionOrderById(orderId);
      if (order) {
        setProductionOrder(order);
        setQuantity(order.quantityToProduce);
      } else {
        toast.error('Production order not found');
        navigate('/manufacturing/production');
      }
    }
  }, [orderId, getProductionOrderById, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productionOrder?.bom?.finishedItemId) {
      toast.error('No finished product defined in the BOM');
      return;
    }
    
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update inventory
      await adjustStock(
        productionOrder.bom.finishedItemId,
        quantity,
        'production',
        `Production of ${productionOrder.bom.productName || 'product'} - Order #${productionOrder.id.substring(0, 8)}`
      );
      
      // Update production order status
      await updateProductionOrderStatus(orderId, 'completed', new Date());
      
      toast.success('Finished goods recorded successfully');
      navigate(`/manufacturing/production/${orderId}`);
    } catch (error) {
      console.error('Error recording finished goods:', error);
      toast.error(`Failed to record finished goods: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!productionOrder) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-[50vh]">
            <p>Loading production order details...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/manufacturing/production/${orderId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Record Finished Goods</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Finished Goods Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product</Label>
                  <Input
                    id="productName"
                    value={productionOrder.bom?.productName || 'Unknown Product'}
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="orderNumber">Production Order #</Label>
                  <Input
                    id="orderNumber"
                    value={productionOrder.id.substring(0, 8)}
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="plannedQuantity">Planned Quantity</Label>
                  <Input
                    id="plannedQuantity"
                    value={productionOrder.quantityToProduce}
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="actualQuantity">Actual Quantity Produced</Label>
                  <Input
                    id="actualQuantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any notes about the production..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="flex items-center">
                  {isLoading ? 'Processing...' : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Record Finished Goods
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecordFinishedGoods;
