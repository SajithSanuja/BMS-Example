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
import { ArrowLeft, Package, Check, Plus, Minus } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const GoodsReceiptPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateItem } = useInventory();
  
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [receiptItems, setReceiptItems] = useState<Array<{id: string, name: string, quantity: number}>>([]);
  
  const handleAddItem = () => {
    if (!selectedItem || quantity <= 0) {
      toast.error('Please select an item and enter a valid quantity');
      return;
    }
    
    const item = items.find(i => i.id === selectedItem);
    if (!item) {
      toast.error('Item not found');
      return;
    }
    
    const existingItemIndex = receiptItems.findIndex(ri => ri.id === selectedItem);
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...receiptItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setReceiptItems(updatedItems);
    } else {
      // Add new item
      setReceiptItems([...receiptItems, {
        id: selectedItem,
        name: item.name,
        quantity: quantity
      }]);
    }
    
    setSelectedItem('');
    setQuantity(0);
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = receiptItems.filter((_, i) => i !== index);
    setReceiptItems(updatedItems);
  };
  
  const handleProcessReceipt = async () => {
    if (receiptItems.length === 0) {
      toast.error('Please add at least one item to the receipt');
      return;
    }
    
    try {
      // Update inventory for each received item
      for (const receiptItem of receiptItems) {
        const inventoryItem = items.find(item => item.id === receiptItem.id);
        if (inventoryItem) {
          await updateItem(inventoryItem.id, {
            currentStock: inventoryItem.currentStock + receiptItem.quantity
          });
        }
      }
      
      toast.success('Goods receipt processed successfully');
      navigate('/inventory');
    } catch (error) {
      console.error('Error processing goods receipt:', error);
      toast.error('Failed to process goods receipt');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventory')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Goods Receipt</h1>
              <p className="text-muted-foreground">Receive inventory items</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Add Items to Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item">Select Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (Current Stock: {item.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Received</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
              </div>
              
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add to Receipt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this receipt..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {receiptItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Items to Receive</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={handleProcessReceipt}>
                  <Check className="h-4 w-4 mr-2" />
                  Process Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GoodsReceiptPage;
