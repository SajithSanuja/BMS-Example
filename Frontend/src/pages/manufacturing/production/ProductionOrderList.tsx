
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Search, RefreshCw } from 'lucide-react';
import { useManufacturing } from '@/hooks/useManufacturing';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ProductionOrderList = () => {
  const navigate = useNavigate();
  const { productionOrders, fetchProductionOrders, isLoading } = useManufacturing();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProductionOrders();
      } catch (error) {
        console.error('Error loading production orders:', error);
        toast.error('Failed to load production orders');
      }
    };
    
    loadData();
  }, [fetchProductionOrders]);
  
  useEffect(() => {
    // Filter the orders whenever productionOrders or searchTerm changes
    const filtered = productionOrders.filter(order => 
      (order.bom?.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.batchId && order.batchId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOrders(filtered);
  }, [productionOrders, searchTerm]);
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProductionOrders(true); // Force refresh
      toast.success('Production orders refreshed');
    } catch (error) {
      console.error('Error refreshing production orders:', error);
      toast.error('Failed to refresh production orders');
    } finally {
      setIsRefreshing(false);
    }
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
              <h1 className="text-3xl font-bold tracking-tight">Production Orders</h1>
              <p className="text-muted-foreground">Manage manufacturing production orders</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => navigate('/manufacturing/production/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Production Order
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Production Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && filteredOrders.length === 0 ? (
                <div className="text-center py-8">Loading production orders...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" 
                          onClick={() => navigate(`/manufacturing/production/${order.id}`)}>
                          <TableCell className="font-medium">{order.batchId || 'N/A'}</TableCell>
                          <TableCell>{order.bom?.productName}</TableCell>
                          <TableCell>{order.quantityToProduce}</TableCell>
                          <TableCell>{format(new Date(order.startDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {(order.status === 'planned') && (
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          {isLoading ? "Loading production orders..." : "No production orders found."}
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
    </Layout>
  );
};

export default ProductionOrderList;
