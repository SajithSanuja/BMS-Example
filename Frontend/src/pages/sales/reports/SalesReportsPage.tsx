
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSales } from '@/hooks/useSales';
import { format, subMonths, subYears, isSameMonth, isSameYear, startOfMonth } from 'date-fns';

const SalesReportsPage = () => {
  const { salesOrders, refreshSalesData } = useSales();
  const [dateRange, setDateRange] = useState('month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    averageOrderValue: 0,
    totalOrders: 0
  });

  useEffect(() => {
    // Ensure we have the latest data
    refreshSalesData();
  }, [refreshSalesData]);

  useEffect(() => {
    // Only consider completed orders
    const completedOrders = salesOrders.filter(order => order.status === 'completed');
    
    // Calculate summary metrics
    const totalSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    setSummary({
      totalSales,
      averageOrderValue,
      totalOrders
    });
    
    // Get recent transactions
    const sortedOrders = [...completedOrders].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
    setRecentTransactions(sortedOrders.slice(0, 5));
    
    // Prepare chart data
    const now = new Date();
    const monthlyData = new Map();
    const yearlyData = new Map();
    
    // Initialize with the last 6 months/years to ensure we have data points even if no sales
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const yearDate = subYears(now, i);
      
      const monthKey = format(monthDate, 'yyyy-MM');
      const yearKey = format(yearDate, 'yyyy');
      
      monthlyData.set(monthKey, { date: monthKey, sales: 0 });
      yearlyData.set(yearKey, { date: yearKey, sales: 0 });
    }
    
    // Populate with actual sales data
    completedOrders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const monthKey = format(orderDate, 'yyyy-MM');
      const yearKey = format(orderDate, 'yyyy');
      
      // Add to monthly data
      if (monthlyData.has(monthKey)) {
        const month = monthlyData.get(monthKey);
        month.sales += order.totalAmount;
        monthlyData.set(monthKey, month);
      }
      
      // Add to yearly data
      if (yearlyData.has(yearKey)) {
        const year = yearlyData.get(yearKey);
        year.sales += order.totalAmount;
        yearlyData.set(yearKey, year);
      }
    });
    
    // Set chart data based on selected date range
    setChartData(
      dateRange === 'month' 
        ? Array.from(monthlyData.values()) 
        : Array.from(yearlyData.values())
    );
    
  }, [salesOrders, dateRange]);

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
            <div className="space-x-2">
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                onClick={() => setDateRange('month')}
              >
                Monthly
              </Button>
              <Button
                variant={dateRange === 'year' ? 'default' : 'outline'}
                onClick={() => setDateRange('year')}
              >
                Yearly
              </Button>
              <Button onClick={() => window.print()}>Export PDF</Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${summary.totalSales.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${summary.averageOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.totalOrders}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => ['$' + Number(value).toFixed(2), 'Sales']} />
                    <Bar dataKey="sales" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.orderDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{transaction.orderNumber}</TableCell>
                        <TableCell>{transaction.customer?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell className="text-right">${transaction.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SalesReportsPage;
