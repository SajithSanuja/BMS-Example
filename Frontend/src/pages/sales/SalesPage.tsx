
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, Package, RefreshCw, BarChart } from 'lucide-react';

const SalesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      title: 'Sales Orders',
      description: 'Create and manage customer orders',
      icon: <FileText className="h-6 w-6 text-gray-500" />,
      path: '/sales/orders'
    },
    {
      title: 'Customers',
      description: 'Manage customer information',
      icon: <Users className="h-6 w-6 text-gray-500" />,
      path: '/sales/customers'
    },
    {
      title: 'POS / Quick Sale',
      description: 'Process direct sales with real-time inventory update',
      icon: <Package className="h-6 w-6 text-gray-500" />,
      path: '/sales/pos'
    },
    {
      title: 'Returns & Exchanges',
      description: 'Process customer returns and exchanges',
      icon: <RefreshCw className="h-6 w-6 text-gray-500" />,
      path: '/sales/returns'
    },
    {
      title: 'Sales Reports',
      description: 'View and export sales performance reports',
      icon: <BarChart className="h-6 w-6 text-gray-500" />,
      path: '/sales/reports'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Module</h1>
            <p className="text-muted-foreground">
              Manage sales orders, customers, and handle returns
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-muted/50 transition-colors border rounded-lg"
                onClick={() => navigate(module.path)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-medium">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                    <div className="flex justify-center mt-2">
                      {module.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesPage;
