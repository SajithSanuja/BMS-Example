
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, Check } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const GoodsReceiptPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { purchaseOrders, updatePurchaseOrderStatus } = usePurchaseOrders();
  const { items, updateItem } = useInventory();
  
  const [selectedPO, setSelectedPO] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedItems, setReceivedItems] = useState<Record<string, number>>({});
  
  // Filter POs to only show draft and sent ones
  const eligiblePOs = purchaseOrders.filter(po => ['draft', 'sent'].includes(po.status));
  
  const handleSelectPO = (poId: string) => {
    setSelectedPO(poId);
    
    // Initialize received quantities to the PO quantities
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      const initialReceivedItems: Record<string, number> = {};
      po.items.forEach(item => {
        initialReceivedItems[item.id] = item.quantity;
      });
      setReceivedItems(initialReceivedItems);
    }
  };
  
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };
  
  const handleReceiveGoods = () => {
    if (!selectedPO) {
      toast.error('Please select a purchase order');
      return;
    }
    
    const po = purchaseOrders.find(p => p.id === selectedPO);
    if (!po) {
      toast.error('Purchase order not found');
      return;
    }
    
    // Validate quantities
    const invalidItems = po.items.filter(item => {
      const receivedQty = receivedItems[item.id] || 0;
      return receivedQty < 0 || receivedQty > item.quantity;
    });
    
    if (invalidItems.length > 0) {
      toast.error('Some received quantities are invalid');
      return;
    }
    
    try {
      // Update inventory
      po.items.forEach(poItem => {
        const receivedQty = receivedItems[poItem.id] || 0;
        if (receivedQty > 0) {
          // Find or create inventory item
          const inventoryItem = items.find(item => item.name === poItem.name);
          
          if (inventoryItem) {
            // Update existing item
            updateItem(inventoryItem.id, {
              currentStock: inventoryItem.currentStock + receivedQty
            });
          } else {
            // Item doesn't exist in inventory, should handle this case in a real app
            toast.warning(`Item "${poItem.name}" not found in inventory`);
          }
        }
      });
      
      // Update PO status
      updatePurchaseOrderStatus(po.id, 'received');
      
      toast.success('Goods received successfully');
      
      // Reset form
      setSelectedPO('');
      setNotes('');
      setReceivedItems({});
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Goods Receipt</h1>
              <p className="text-muted-foreground">Record received goods from purchase orders</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receive Goods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="purchaseOrder">Select Purchase Order</Label>
                <Select value={selectedPO} onValueChange={handleSelectPO}>
                  <SelectTrigger id="purchaseOrder">
                    <SelectValue placeholder="Select a purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligiblePOs.length > 0 ? (
                      eligiblePOs.map(po => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.orderNumber} - {po.supplier.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No eligible purchase orders
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPO && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Items to Receive</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-center">Ordered Qty</TableHead>
                          <TableHead className="text-center">Received Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.find(p => p.id === selectedPO)?.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={receivedItems[item.id] || 0}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                className="text-center"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button onClick={handleReceiveGoods} className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Complete Goods Receipt
                  </Button>
                </>
              )}
              
              {!selectedPO && eligiblePOs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <Package size={48} className="text-muted-foreground" />
                  <h3 className="text-xl font-medium">No Purchase Orders to Receive</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no purchase orders in 'draft' or 'sent' status to receive goods for.
                    Create a purchase order first.
                  </p>
                  <Button onClick={() => navigate('/procurement/orders/new')}>
                    Create Purchase Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default GoodsReceiptPage;
