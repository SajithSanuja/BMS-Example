
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useManufacturing } from '@/hooks/useManufacturing';
import { ArrowLeft, Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BOMList = () => {
  const navigate = useNavigate();
  const { boms, deleteBOM, fetchBOMs } = useManufacturing();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bomToDelete, setBomToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchBOMs();
      } catch (error) {
        console.error('Error loading BOMs:', error);
        toast.error('Failed to load Bill of Materials');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchBOMs]);

  const filteredBOMs = boms.filter(bom =>
    bom.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBOM = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBomToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!bomToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteBOM(bomToDelete);
      setShowDeleteDialog(false);
      setBomToDelete(null);
    } catch (error) {
      console.error('Error deleting BOM:', error);
      toast.error('Failed to delete BOM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (bomId: string) => {
    navigate(`/manufacturing/bom/${bomId}`);
  };

  const handleEditClick = (bomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/manufacturing/bom/${bomId}/edit`);
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/manufacturing')} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
              <p className="text-muted-foreground">Manage product specifications and materials</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search BOMs..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate('/manufacturing/bom/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New BOM
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Bills of Materials
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading BOMs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Materials Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBOMs.length > 0 ? (
                      filteredBOMs.map((bom) => (
                        <TableRow 
                          key={bom.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(bom.id)}
                        >
                          <TableCell className="font-medium">{bom.productName}</TableCell>
                          <TableCell>{bom.description || '-'}</TableCell>
                          <TableCell>{bom.materials.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => handleEditClick(bom.id, e)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => handleDeleteBOM(bom.id, e)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {boms.length === 0 
                            ? 'No BOMs found. Create a new BOM to get started.' 
                            : 'No BOMs matching your search criteria.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this BOM?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the Bill of Materials
              from the database. If this BOM is used in any production orders, those references
              may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBomToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default BOMList;
