import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestAdjustments = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/stock')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Test Adjustments Page</h1>
        </div>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ The adjustments route is working correctly!
        </div>
        
        <div className="mt-4 space-y-2">
          <p><strong>Current URL:</strong> /inventory/adjustments</p>
          <p><strong>Route Status:</strong> Successfully loaded</p>
          <p><strong>Component:</strong> TestAdjustments (temporary test component)</p>
        </div>

        <div className="mt-6">
          <Button onClick={() => navigate('/inventory/stock')} className="mr-2">
            Back to Stock Visibility
          </Button>
          <Button onClick={() => navigate('/inventory')} variant="outline">
            Back to Inventory Home
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default TestAdjustments;
