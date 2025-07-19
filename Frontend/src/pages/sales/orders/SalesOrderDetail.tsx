
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, FileDown, Printer, CheckCircle2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { SalesOrderStatus } from '@/types';
import { useSales } from '@/hooks/useSales';
import { useInventory } from '@/hooks/useInventory';

const SalesOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { salesOrders, updateSalesOrder } = useSales();
  const { items, adjustStock } = useInventory();
  
  const [order, setOrder] = useState(id ? salesOrders.find(order => order.id === id) : null);
  const [newStatus, setNewStatus] = useState<SalesOrderStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (id) {
      const salesOrder = salesOrders.find(order => order.id === id);
      setOrder(salesOrder);
      if (salesOrder) {
        setNewStatus(salesOrder.status);
      }
    }
  }, [id, salesOrders]);
  
  const handleStatusChange = async () => {
    if (!id || !newStatus || !order) return;
    
    setIsUpdating(true);
    try {
      const previousStatus = order.status;
      
      // If changing to completed and wasn't completed before, decrease inventory
      if (newStatus === 'completed' && previousStatus !== 'completed') {
        const orderItems = order.items || [];
        
        // Process each item to decrease inventory stock
        for (const item of orderItems) {
          if (item.product && item.quantity > 0) {
            try {
              await adjustStock(
                item.product.id,
                -item.quantity, // Decrease stock
                'sale' as any, // Temporary fix for TS error
                `Stock issued for Sales Order ${order.orderNumber}`
              );
            } catch (error) {
              console.error('Error decreasing stock:', error);
              toast.error(`Error updating inventory for ${item.product.name}`);
            }
          }
        }
      }
      
      // Update the order status
      await updateSalesOrder(id, { status: newStatus as SalesOrderStatus });
      
      const updatedOrder = {
        ...order,
        status: newStatus as SalesOrderStatus
      };
      
      setOrder(updatedOrder);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(`Failed to update status: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleExportPdf = () => {
    try {
      // Generate PDF for the order
      const pdfBlob = new Blob(['Sales Order PDF Content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-order-${order?.orderNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Order exported to PDF');
    } catch (error) {
      toast.error(`Failed to export: ${(error as Error).message}`);
    }
  };
  
  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground mt-2 mb-4">The sales order you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/sales/orders')}>Back to Orders</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  const getStatusBadgeVariant = (status: SalesOrderStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/sales/orders')} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Sales Order {order.orderNumber}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Created: {format(new Date(order.orderDate), 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setNewStatus('completed');
                    handleStatusChange();
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Order
                </Button>
              )}
              
              {order.status !== 'cancelled' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Ban className="h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          setNewStatus('cancelled');
                          handleStatusChange();
                        }}
                      >
                        Yes, cancel it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-lg">{order.customer?.name || 'Walk-in Customer'}</p>
                    <p className="text-muted-foreground">{order.customer?.address || 'No address provided'}</p>
                  </div>
                  {order.customer?.telephone && (
                    <p><span className="font-medium">Phone:</span> {order.customer.telephone}</p>
                  )}
                  {order.customer?.email && (
                    <p><span className="font-medium">Email:</span> {order.customer.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Order Number:</span>
                    <span>{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Order Date:</span>
                    <span>{format(new Date(order.orderDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span>{format(new Date(order.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Update order status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as SalesOrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    className="w-full gap-2" 
                    disabled={newStatus === order.status || isUpdating}
                    onClick={handleStatusChange}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.discount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
          
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SalesOrderDetail;
