
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useManufacturing } from '@/hooks/useManufacturing';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ProductionLog = () => {
  const { productionOrders } = useManufacturing();

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Production Log</h1>
            <Button onClick={() => window.print()}>Export PDF</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Labor Hours</TableHead>
                <TableHead>Labor Cost</TableHead>
                <TableHead>Additional Costs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>{order.bom.productName}</TableCell>
                  <TableCell>{order.quantityToProduce}</TableCell>
                  <TableCell>{order.laborHours}</TableCell>
                  <TableCell>${order.laborCost}</TableCell>
                  <TableCell>${order.additionalCosts}</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default ProductionLog;
