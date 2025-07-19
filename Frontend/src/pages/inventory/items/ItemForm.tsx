
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { UnitOfMeasure, InventoryItem } from '@/types';
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

const unitOfMeasureOptions: { value: UnitOfMeasure; label: string }[] = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'liters', label: 'Liter' },
  { value: 'meters', label: 'Meter' },
  { value: 'units', label: 'Units' }
];

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { addItem, updateItem, getItemById } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unitOfMeasure: 'pieces' as UnitOfMeasure,
    purchaseCost: '0',
    sellingPrice: '0',
    currentStock: '0',
    reorderLevel: '0',
    sku: '',
    isActive: true
  });

  useEffect(() => {
    if (isEditMode && id) {
      const item = getItemById(id);
      if (item) {
        setFormData({
          name: item.name,
          description: item.description,
          category: item.category || '',
          unitOfMeasure: item.unitOfMeasure,
          purchaseCost: item.purchaseCost.toString(),
          sellingPrice: item.sellingPrice.toString(),
          currentStock: item.currentStock.toString(),
          reorderLevel: item.reorderLevel.toString(),
          sku: item.sku || '',
          isActive: item.isActive
        });
      } else {
        toast.error('Item not found');
        navigate('/inventory/items');
      }
    }
  }, [id, isEditMode, getItemById, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, unitOfMeasure: value as UnitOfMeasure }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    const purchaseCost = parseFloat(formData.purchaseCost);
    const sellingPrice = parseFloat(formData.sellingPrice);
    const currentStock = parseInt(formData.currentStock);
    const reorderLevel = parseInt(formData.reorderLevel);

    if (isNaN(purchaseCost) || purchaseCost < 0) {
      toast.error('Purchase cost must be a positive number');
      return;
    }

    if (isNaN(sellingPrice) || sellingPrice < 0) {
      toast.error('Selling price must be a positive number');
      return;
    }

    if (isNaN(currentStock) || currentStock < 0) {
      toast.error('Current stock must be a positive number');
      return;
    }
    
    try {
      if (isEditMode && id) {
        updateItem(id, {
          name: formData.name,
          description: formData.description,
          category: formData.category || undefined,
          unitOfMeasure: formData.unitOfMeasure,
          purchaseCost,
          sellingPrice,
          currentStock,
          reorderLevel,
          sku: formData.sku || undefined,
          isActive: formData.isActive
        });
        toast.success('Item updated successfully');
      } else {
        const itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
          name: formData.name,
          description: formData.description,
          category: formData.category || '',
          unitOfMeasure: formData.unitOfMeasure,
          purchaseCost,
          sellingPrice,
          currentStock,
          reorderLevel,
          sku: formData.sku || '',
          isActive: formData.isActive
        };
        addItem(itemData);
        toast.success('Item added successfully');
      }
      navigate('/inventory/items');
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/items')} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Item' : 'Add Item'}</h1>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter item name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter item description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="Enter category"
                    value={formData.category}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                  <Select 
                    value={formData.unitOfMeasure} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger id="unitOfMeasure">
                      <SelectValue placeholder="Select unit of measure" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOfMeasureOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseCost">Purchase Cost</Label>
                    <Input
                      id="purchaseCost"
                      name="purchaseCost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter purchase cost"
                      value={formData.purchaseCost}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price</Label>
                    <Input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter selling price"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Initial Stock</Label>
                  <Input
                    id="currentStock"
                    name="currentStock"
                    type="number"
                    min="0"
                    placeholder="Enter initial stock quantity"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => navigate('/inventory/items')}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Item' : 'Add Item'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ItemForm;
