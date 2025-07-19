
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useInventory } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { ProductionOrder, ProductionStatus } from '@/types';
import { Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const ProductionLog = () => {
  const navigate = useNavigate();
  const { productionOrders, fetchProductionOrders, boms, isLoading } = useManufacturing();
  const { items } = useInventory();
  const [productionLog, setProductionLog] = useState<ProductionOrder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<ProductionOrder[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProductionOrders();
      } catch (error) {
        console.error('Error loading production orders:', error);
        toast.error('Failed to load production records');
      }
    };
    
    loadData();
  }, [fetchProductionOrders]);

  useEffect(() => {
    // Update production log when production orders change
    const sortedOrders = [...productionOrders].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    setProductionLog(sortedOrders);
  }, [productionOrders]);

  useEffect(() => {
    // Filter logs when productionLog or searchTerm changes
    const filtered = productionLog.filter(order => {
      const productName = getProductName(order.bomId).toLowerCase();
      const batchId = (order.batchId || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return productName.includes(search) || batchId.includes(search);
    });
    
    setFilteredLogs(filtered);
  }, [productionLog, searchTerm]);

  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductName = (bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    if (!bom) return 'Unknown Product';
    
    const finishedItem = items.find(item => item.id === bom.finishedItemId);
    return finishedItem?.name || bom.productName;
  };
  
  const exportToExcel = () => {
    try {
      const exportData = productionLog.map(order => ({
        'Date': format(new Date(order.startDate), 'MMM d, yyyy'),
        'Product': getProductName(order.bomId),
        'Quantity': order.quantityToProduce,
        'Status': order.status,
        'Total Cost': order.totalCost ? `$${order.totalCost.toFixed(2)}` : '-',
        'Labor Cost': order.laborCost ? `$${order.laborCost.toFixed(2)}` : '-',
        'Batch ID': order.batchId || '-'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Log');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'Production_Log.xlsx');
      toast.success('Production log exported to Excel');
    } catch (error) {
      console.error('Error exporting production log:', error);
      toast.error('Failed to export production log');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProductionOrders(true); // Force refresh
      toast.success('Production records refreshed');
    } catch (error) {
      console.error('Error refreshing production records:', error);
      toast.error('Failed to refresh production records');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Production Log</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => navigate('/manufacturing/production/new')}>
              Create New Order
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Search by product or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Production History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading production records...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{format(new Date(order.startDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{order.batchId || '-'}</TableCell>
                      <TableCell>{getProductName(order.bomId)}</TableCell>
                      <TableCell>{order.quantityToProduce}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'planned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/manufacturing/production/record/${order.id}`);
                            }}
                          >
                            Record Production
                          </Button>
                        )}
                        {(order.status === 'in_progress' || order.status === 'in-progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/manufacturing/production/record/${order.id}`);
                            }}
                          >
                            Continue Production
                          </Button>
                        )}
                        {order.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/manufacturing/production/${order.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {isLoading ? "Loading production records..." : "No production logs found."}
                </p>
                {!isLoading && (
                  <Button className="mt-4" onClick={() => navigate('/manufacturing/production/new')}>
                    Create Production Order
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductionLog;
