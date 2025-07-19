
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, Download } from 'lucide-react';
import { useFinancials } from '@/hooks/useFinancials';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const ProfitLossPage = () => {
  const navigate = useNavigate();
  const { transactions, getFinancialSummary } = useFinancials();
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Get summary data
  const summary = getFinancialSummary(startDate, endDate);

  // Prepare data for chart
  const getChartData = useCallback(() => {
    // Filter transactions within the date range
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    );

    // Group transactions by category
    const categories: Record<string, { income: number; expense: number }> = {};

    filteredTransactions.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        categories[t.category].income += t.amount;
      } else {
        categories[t.category].expense += t.amount;
      }
    });

    // Convert to chart data
    return Object.keys(categories).map(category => ({
      category,
      Income: categories[category].income,
      Expenses: categories[category].expense,
      Profit: categories[category].income - categories[category].expense
    }));
  }, [transactions, startDate, endDate]);

  const chartData = getChartData();

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const today = new Date();
    let newStartDate = new Date();

    switch (value) {
      case 'week':
        newStartDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        newStartDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        newStartDate.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        newStartDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        break;
    }

    setStartDate(newStartDate);
    setEndDate(today);
  };

  // Export to PDF
  const exportToPdf = async () => {
    try {
      // Format date range
      const formattedStartDate = format(startDate, 'MMM d, yyyy');
      const formattedEndDate = format(endDate, 'MMM d, yyyy');
      
      // Prepare profit & loss data as text for now
      // In a real app, you would use a PDF library
      const content = `
        PROFIT & LOSS REPORT
        Period: ${formattedStartDate} - ${formattedEndDate}
        
        SUMMARY:
        Total Income: $${summary.income.toFixed(2)}
        Total Expenses: $${summary.expenses.toFixed(2)}
        Net Profit/Loss: $${summary.balance.toFixed(2)}
        
        BREAKDOWN BY CATEGORY:
        ${chartData.map(item => 
          `${item.category}:
           - Income: $${item.Income.toFixed(2)}
           - Expenses: $${item.Expenses.toFixed(2)}
           - Profit/Loss: $${item.Profit.toFixed(2)}
          `
        ).join('\n')}
      `;
      
      // Create a download link for the text file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Profit_Loss_Report_${formattedStartDate}_to_${formattedEndDate}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Profit & Loss report exported successfully');
    } catch (error) {
      console.error('Error exporting profit & loss report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/financials')} className="h-8 w-8 mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
            <p className="text-muted-foreground">View income, expenses, and profitability</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Tabs defaultValue={period} onValueChange={handlePeriodChange} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span>to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={exportToPdf}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Income</CardTitle>
              <CardDescription>Total for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">${summary.income.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Expenses</CardTitle>
              <CardDescription>Total for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">${summary.expenses.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Net Profit/Loss</CardTitle>
              <CardDescription>Income minus expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Profit & Loss by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="Income" fill="#10b981" />
                    <Bar dataKey="Expenses" fill="#ef4444" />
                    <Bar dataKey="Profit" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.length > 0 ? (
                    chartData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right text-green-600">${item.Income.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-red-600">${item.Expenses.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${item.Profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${item.Profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfitLossPage;
