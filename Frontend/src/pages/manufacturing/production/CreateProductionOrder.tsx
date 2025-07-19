
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CreateProductionOrder = () => {
  const navigate = useNavigate();
  const { boms, createProductionOrder } = useManufacturing();
  const { items } = useInventory();
  
  const [selectedBOM, setSelectedBOM] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [completionDate, setCompletionDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBOM) {
      toast.error('Please select a BOM');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createProductionOrder(
        selectedBOM,
        quantity,
        startDate
      );
      
      toast.success('Production order created successfully');
      navigate('/manufacturing/production');
    } catch (error) {
      console.error('Error creating production order:', error);
      toast.error('Failed to create production order');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Create Production Order</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Production Order Details</CardTitle>
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
                    {boms.map((bom) => {
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
                <Label htmlFor="quantity">Quantity to Produce</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Expected Completion Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !completionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {completionDate ? format(completionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={completionDate}
                      onSelect={(date) => date && setCompletionDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any notes or special instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/manufacturing/production')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Production Order'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateProductionOrder;
