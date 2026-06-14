'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerForm } from '@/components/customers/customer-form';
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

export default function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCustomerCreated = () => {
    setIsDialogOpen(false);
    // Trigger a refresh of the customer list
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
                Customer Management
              </h1>
              <p className="text-muted-foreground mt-2">
                View and manage your customer database
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Enter customer information to add them to your CRM database.
                  </DialogDescription>
                </DialogHeader>
                <CustomerForm
                  onSuccess={handleCustomerCreated}
                  onCancel={handleDialogClose}
                />
              </DialogContent>
            </Dialog>
          </div>
          <CustomerList key={refreshKey} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
