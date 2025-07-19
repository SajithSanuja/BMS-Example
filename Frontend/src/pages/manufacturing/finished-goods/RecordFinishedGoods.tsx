
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';

const RecordFinishedGoods = () => {
  const { boms, productionOrders } = useManufacturing();
  const { items, adjustStock } = useInventory();
  const [selectedBOM, setSelectedBOM] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filteredBOMs, setFilteredBOMs] = useState(boms);

  useEffect(() => {
    // Filter BOMs that have a finishedItemId that exists in our items
    const validBOMs = boms.filter(bom => 
      bom.finishedItemId && items.some(item => item.id === bom.finishedItemId)
    );
    setFilteredBOMs(validBOMs);
  }, [boms, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBOM) {
      toast.error('Please select a BOM');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const bom = boms.find(b => b.id === selectedBOM);
      
      if (!bom || !bom.finishedItemId) {
        toast.error('Selected BOM has no finished product defined');
        return;
      }
      
      // Increase inventory for the finished item
      await adjustStock(
        bom.finishedItemId,
        quantity,
        'production' as any, // Temporary fix for TS error
        `Recorded ${quantity} finished goods from BOM ${bom.productName}`
      );
      
      toast.success(`Successfully recorded ${quantity} finished goods`);
      setSelectedBOM('');
      setQuantity(1);
    } catch (error) {
      console.error('Error recording finished goods:', error);
      toast.error('Failed to record finished goods');
    } finally {
      setIsLoading(false);
    }
  };

  if (boms.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">No BOMs Available</h2>
                <p className="text-muted-foreground">You need to create a Bill of Materials first.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/manufacturing/bom/new'}>
                  Create BOM
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Record Finished Goods</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Record Production Output</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bom">Bill of Materials</Label>
                <Select
                  value={selectedBOM}
                  onValueChange={setSelectedBOM}
                >
                  <SelectTrigger id="bom">
                    <SelectValue placeholder="Select a BOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBOMs.map((bom) => {
                      const finishedItem = items.find(item => item.id === bom.finishedItemId);
                      return (
                        <SelectItem key={bom.id} value={bom.id}>
                          {bom.productName} - Produces: {finishedItem?.name || 'Unknown Item'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Produced</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <Button type="submit" disabled={isLoading || !selectedBOM}>
                {isLoading ? 'Recording...' : 'Record Finished Goods'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecordFinishedGoods;
