
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ArrowRight } from 'lucide-react';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BOM } from '@/types';

const BOMDetails = () => {
  const { bomId } = useParams<{ bomId: string }>();
  const navigate = useNavigate();
  const { getBOMById } = useManufacturing();
  const { getItemById } = useInventory();
  const [bom, setBom] = useState<BOM | null>(null);
  const [finishedProduct, setFinishedProduct] = useState<any>(null);

  useEffect(() => {
    if (bomId) {
      const bomData = getBOMById(bomId);
      if (bomData) {
        setBom(bomData);
        
        if (bomData.finishedItemId) {
          const product = getItemById(bomData.finishedItemId);
          if (product) {
            setFinishedProduct(product);
          }
        }
      } else {
        toast.error('BOM not found');
        navigate('/manufacturing/bom');
      }
    }
  }, [bomId, getBOMById, getItemById, navigate]);

  if (!bom) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-[50vh]">
            <p>Loading BOM details...</p>
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
            onClick={() => navigate('/manufacturing/bom')} 
            className="h-8 w-8 mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{bom.productName}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/manufacturing/bom/${bomId}`)}
            className="ml-auto"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Materials */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Raw Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {bom.materials.length > 0 ? (
                <ul className="space-y-3">
                  {bom.materials.map((material, index) => (
                    <li key={index} className="border-b pb-2">
                      <p className="font-medium">{material.name}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="text-sm">{material.quantity} {material.unitOfMeasure}</p>
                      </div>
                      {material.item && (
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-muted-foreground">Current Stock</p>
                          <p className="text-sm">{material.item.currentStock} {material.item.unitOfMeasure}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No materials defined for this BOM</p>
              )}
            </CardContent>
          </Card>

          {/* Middle column - Process Flow */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4 p-4">
              <div className="border p-4 rounded-lg bg-muted/50 text-center w-full">
                <p className="text-sm font-medium mb-2">Raw Materials</p>
                <div className="space-y-2">
                  {bom.materials.map((material, index) => (
                    <Badge key={index} variant="outline" className="block truncate">
                      {material.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <ArrowRight className="h-12 w-12 rotate-90 md:rotate-0 text-primary/50" />
              
              <div className="border p-4 rounded-lg bg-primary/10 text-center w-full">
                <p className="text-sm font-medium mb-2">Production Result</p>
                <Badge variant="outline" className="block truncate">
                  {finishedProduct ? finishedProduct.name : 'No finished product defined'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right column - Details and Actions */}
          <div className="md:col-span-1">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>BOM Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p>{format(new Date(bom.createdAt), 'MMM d, yyyy')}</p>
                </div>
                
                {bom.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p>{bom.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Finished Product</h3>
                  {finishedProduct ? (
                    <div className="mt-1">
                      <p className="font-medium">{finishedProduct.name}</p>
                      <p className="text-sm text-muted-foreground">{finishedProduct.unitOfMeasure}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">No finished product defined</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/manufacturing/production/new', { state: { bomId: bomId } })}
                >
                  Create Production Order
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/manufacturing/bom')}
                >
                  Back to List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BOMDetails;
