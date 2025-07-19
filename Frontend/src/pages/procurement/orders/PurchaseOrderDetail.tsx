
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableFooter
} from '@/components/ui/table';
import { 
  Badge,
} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PurchaseOrderStatus } from '@/types';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { ArrowLeft, FileText, Check, X, Printer, FileDown, Truck, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getPurchaseOrderById, 
    updatePurchaseOrderStatus,
    exportOrderToPdf,
    isLoading 
  } = usePurchaseOrders();
  
  const [order, setOrder] = useState(id ? getPurchaseOrderById(id) : null);
  const [newStatus, setNewStatus] = useState<PurchaseOrderStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (id) {
      const purchaseOrder = getPurchaseOrderById(id);
      setOrder(purchaseOrder);
      if (purchaseOrder) {
        setNewStatus(purchaseOrder.status);
      }
    }
  }, [id, getPurchaseOrderById]);
  
  const handleStatusChange = async () => {
    if (!id || !newStatus) return;
    
    setIsUpdating(true);
    try {
      await updatePurchaseOrderStatus(id, newStatus as PurchaseOrderStatus);
      setOrder(getPurchaseOrderById(id));
      toast.success(`Purchase order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(`Failed to update status: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleExportPdf = async () => {
    if (!id) return;
    
    try {
      await exportOrderToPdf(id);
    } catch (error) {
      toast.error(`Failed to export: ${(error as Error).message}`);
    }
  };
  
  const getStatusBadgeVariant = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft': return 'outline';
      case 'sent': return 'secondary';
      case 'received': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  if (!order) {
    return (
      <Layout>
        <div className="container">
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2">Purchase Order Not Found</h2>
            <p className="text-muted-foreground mb-4">The purchase order you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/procurement/orders')}>
              Back to Purchase Orders
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/procurement/orders')} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Purchase Order {order.orderNumber}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Created: {format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
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
              
              {order.status === 'draft' && (
                <Button size="sm" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Send to Supplier
                </Button>
              )}
              
              {(order.status === 'draft' || order.status === 'sent') && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Ban className="h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this purchase order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          updatePurchaseOrderStatus(id!, 'cancelled');
                          setOrder(getPurchaseOrderById(id!));
                          toast.success('Purchase order cancelled');
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
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-lg">{order.supplier.name}</p>
                    <p className="text-muted-foreground">{order.supplier.address}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Phone:</span> {order.supplier.telephone}</p>
                    <p><span className="font-medium">Payment Terms:</span> {order.supplier.paymentTerms}</p>
                  </div>
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
                    <span className="font-medium">Created Date:</span>
                    <span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span>{format(new Date(order.updatedAt), 'MMM d, yyyy')}</span>
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
                <CardDescription>Update purchase order status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as PurchaseOrderStatus)}
                    disabled={order.status === 'cancelled' || order.status === 'completed'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    className="w-full gap-2" 
                    disabled={
                      newStatus === order.status || 
                      isUpdating || 
                      order.status === 'cancelled' || 
                      order.status === 'completed'
                    }
                    onClick={handleStatusChange}
                  >
                    <Check className="h-4 w-4" />
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.totalCost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
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

export default PurchaseOrderDetail;
