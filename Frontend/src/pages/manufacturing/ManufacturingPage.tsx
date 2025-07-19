
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Factory, ClipboardList, PackageCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ManufacturingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const manufacturingCards = [
    {
      title: 'Bill of Materials',
      description: 'Define product recipes and material requirements',
      icon: <FileSpreadsheet className="h-12 w-12 text-primary/70" />,
      path: '/manufacturing/bom'
    },
    {
      title: 'Production Orders',
      description: 'Plan and track manufacturing production orders',
      icon: <Factory className="h-12 w-12 text-primary/70" />,
      path: '/manufacturing/production'
    },
    {
      title: 'Production Log',
      description: 'View historical production data and costs',
      icon: <ClipboardList className="h-12 w-12 text-primary/70" />,
      path: '/manufacturing/production-log'
    },
    {
      title: 'Finished Goods',
      description: 'Process and receive manufactured products',
      icon: <PackageCheck className="h-12 w-12 text-primary/70" />,
      path: '/manufacturing/finished-goods'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manufacturing</h1>
            <p className="text-muted-foreground">Plan production, track manufacturing processes, and manage finished goods</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturingCards.map((card, index) => (
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

export default ManufacturingPage;
