'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { OrderList } from '@/components/orders/order-list';
import { OrderForm } from '@/components/orders/order-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function OrdersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderCreated = () => {
    setIsDialogOpen(false);
    // Trigger a refresh of the order list
    setRefreshKey((prev) => prev + 1);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-playfair">
                Order Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Track and manage customer orders
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Order</DialogTitle>
                  <DialogDescription>
                    Create a new order for an existing customer.
                  </DialogDescription>
                </DialogHeader>
                <OrderForm
                  onSuccess={handleOrderCreated}
                  onCancel={handleDialogClose}
                />
              </DialogContent>
            </Dialog>
          </div>
          <OrderList key={refreshKey} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
