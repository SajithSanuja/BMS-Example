
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, RefreshCw, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const inventoryCards = [
    {
      title: 'Item Management',
      description: 'Create and edit inventory items',
      icon: <Package className="h-12 w-12 text-primary/70" />,
      path: '/inventory/items',
      roles: ['manager', 'employee']
    },
    {
      title: 'Stock Visibility',
      description: 'View current stock levels',
      icon: <Warehouse className="h-12 w-12 text-primary/70" />,
      path: '/inventory/stock',
      roles: ['manager', 'employee']
    },
    {
      title: 'Goods Receipt',
      description: 'Record received goods and update inventory',
      icon: <ArrowDownToLine className="h-12 w-12 text-primary/70" />,
      path: '/inventory/goods-receipt',
      roles: ['manager', 'employee']
    },
    {
      title: 'Returns/Refunds',
      description: 'Process returns and update inventory',
      icon: <ArrowUpFromLine className="h-12 w-12 text-primary/70" />,
      path: '/inventory/returns',
      roles: ['manager', 'employee']
    },
    {
      title: 'Adjustments',
      description: 'Make inventory corrections',
      icon: <RefreshCw className="h-12 w-12 text-primary/70" />,
      path: '/inventory/adjustments',
      roles: ['manager', 'employee']
    }
  ];

  // Filter cards based on user role
  const filteredCards = inventoryCards.filter(card => 
    user && card.roles.includes(user.role)
  );

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Manage inventory items, track stock levels, and make adjustments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card, index) => (
              <Card key={index} className="hover:shadow-md transition-all cursor-pointer hover-lift" onClick={() => navigate(card.path)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center py-4">
                    {card.icon}
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

export default InventoryPage;
