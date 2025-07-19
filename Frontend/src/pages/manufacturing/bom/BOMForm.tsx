
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { BOM, Material, UnitOfMeasure } from '@/types';
import { nanoid } from 'nanoid';
import { Plus, Trash, ArrowLeft } from 'lucide-react';

const BOMForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addBOM, updateBOM, getBOMById } = useManufacturing();
  const { items } = useInventory();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Array<{
    id: string;
    itemId: string;
    quantity: number;
    unitOfMeasure: string;
  }>>([]);

  const [selectedFinishedItem, setSelectedFinishedItem] = useState<string>('');
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{
    name: string;
    description: string;
    totalCost: number;
  }>();

  useEffect(() => {
    if (id) {
      const bom = getBOMById(id);
      if (bom) {
        setValue('name', bom.name || bom.productName);
        setValue('description', bom.description);
        setValue('totalCost', bom.totalCost || 0);
        setSelectedFinishedItem(bom.finishedItemId || '');
        
        // Convert materials to the format expected by the component
        const formattedMaterials = bom.materials.map(mat => ({
          id: mat.id,
          itemId: mat.itemId,
          quantity: mat.quantity,
          unitOfMeasure: mat.unitOfMeasure,
        }));
        
        setMaterials(formattedMaterials);
      }
    } else {
      // Initialize with one empty material only if materials array is empty
      if (materials.length === 0) {
        addMaterial();
      }
    }
  }, [id, getBOMById, setValue]);

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        id: nanoid(),
        itemId: '',
        quantity: 1,
        unitOfMeasure: 'pieces',
      },
    ]);
  };

  const removeMaterial = (index: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials.splice(index, 1);
    setMaterials(updatedMaterials);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setMaterials(updatedMaterials);
  };

  const onSubmit = async (data: { name: string; description: string; totalCost: number }) => {
    if (materials.length === 0) {
      toast.error('Please add at least one material');
      return;
    }

    if (!selectedFinishedItem) {
      toast.error('Please select a finished product');
      return;
    }

    setIsLoading(true);

    try {
      // Convert materials to the format expected by the API
      const formattedMaterials: Material[] = materials.map(mat => ({
        id: mat.id,
        itemId: mat.itemId,
        name: items.find(item => item.id === mat.itemId)?.name || '',
        quantity: mat.quantity,
        unitOfMeasure: mat.unitOfMeasure as UnitOfMeasure,
      }));

      const bomData = {
        name: data.name,
        productName: data.name,
        description: data.description,
        materials: formattedMaterials,
        totalCost: data.totalCost,
        finishedItemId: selectedFinishedItem,
      };

      if (id) {
        await updateBOM(id, bomData.productName, bomData.description, bomData.materials, bomData.finishedItemId);
        toast.success('BOM updated successfully');
      } else {
        await addBOM(bomData.productName, bomData.description, bomData.materials, bomData.finishedItemId);
        toast.success('BOM created successfully');
      }
      navigate('/manufacturing/bom');
    } catch (error) {
      console.error('Error saving BOM:', error);
      toast.error('Error saving BOM');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 h-8 w-8"
            onClick={() => navigate('/manufacturing/bom')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Create'} Bill of Materials</h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Materials */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Materials</CardTitle>
                  <Button type="button" onClick={addMaterial} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </CardHeader>
                <CardContent>
                  {materials.length === 0 ? (
                    <p className="text-muted-foreground">No materials added yet. Click "Add Material" to add some.</p>
                  ) : (
                    <div className="space-y-4">
                      {materials.map((material, index) => (
                        <div key={material.id} className="border p-4 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="font-semibold">Material {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>Select Material</Label>
                            <Select
                              value={material.itemId}
                              onValueChange={(value) => handleMaterialChange(index, 'itemId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} {item.sku ? `(${item.sku})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={material.quantity}
                                onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Unit</Label>
                              <Select
                                value={material.unitOfMeasure}
                                onValueChange={(value) => handleMaterialChange(index, 'unitOfMeasure', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pieces">Pieces</SelectItem>
                                  <SelectItem value="meters">Meters</SelectItem>
                                  <SelectItem value="kilograms">Kilograms</SelectItem>
                                  <SelectItem value="liters">Liters</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Final product details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Finished Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">BOM Name</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'BOM name is required' })}
                      placeholder="Enter BOM name"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="finished-item">Select Finished Product</Label>
                    <Select
                      value={selectedFinishedItem}
                      onValueChange={setSelectedFinishedItem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select finished product" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} {item.sku ? `(${item.sku})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalCost">Total Cost</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('totalCost', { required: 'Total cost is required' })}
                      placeholder="Enter total cost"
                    />
                    {errors.totalCost && <p className="text-red-500 text-sm">{errors.totalCost.message}</p>}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/manufacturing/bom')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : id ? 'Update BOM' : 'Create BOM'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default BOMForm;
