import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ItemManagement = () => {
  const navigate = useNavigate();
  const { items, deleteItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(itemToDelete);
        toast.success('Item deleted successfully');
        setShowDeleteDialog(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      }
    }
  };

  const handleEditItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/inventory/items/${id}/edit`);
  };

  const handleRowClick = (id: string) => {
    navigate(`/inventory/items/${id}`);
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel export
      const exportData = items.map(item => ({
        'Name': item.name,
        'Category': item.category || 'N/A',
        'SKU': item.sku || 'N/A',
        'Unit': item.unitOfMeasure,
        'Current Stock': item.currentStock,
        'Reorder Level': item.reorderLevel,
        'Purchase Cost': `$${(item.purchaseCost || 0).toFixed(2)}`,
        'Selling Price': `$${(item.sellingPrice || 0).toFixed(2)}`,
        'Description': item.description
      }));
      
      // Create workbook and add worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Items');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'inventory_items.xlsx');
      
      toast.success('Inventory items exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting inventory items to Excel:', error);
      toast.error('Failed to export inventory items');
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
              <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
              <p className="text-muted-foreground">Create and edit inventory items</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => navigate('/inventory/items/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Items
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Purchase Cost</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell 
                          className="font-medium cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          {item.name}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          {item.category || '-'}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          {item.unitOfMeasure}
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          ${(item.purchaseCost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          ${(item.sellingPrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleEditItem(item.id, e)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => openDeleteDialog(item.id, e)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No items found. Add a new item to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ItemManagement;
