'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateOrderRequest, Customer } from '@/lib/types';

interface OrderFormProps {
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderForm({ customerId, onSuccess, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState<CreateOrderRequest>({
    customerId: customerId || '',
    orderAmount: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.customers.getAll();

      // Handle different response formats
      const customersArray = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: Customer[] })?.data)
        ? (response as { data: Customer[] }).data
        : [];

      setCustomers(customersArray);
    } catch {
      toast({
        title: 'Failed to load customers',
        description: 'Unable to fetch customers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerId) {
      toast({
        title: 'Customer is required',
        description: 'Please select a customer for this order.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.orderAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Order amount must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.orders.create({
        ...formData,
        orderDate: new Date().toISOString(),
      });

      const selectedCustomer = customers.find(
        (c) => c._id === formData.customerId
      );
      toast({
        title: 'Order created',
        description: `Order for ${
          selectedCustomer?.name || 'customer'
        } has been added successfully.`,
      });
      setFormData({ customerId: customerId || '', orderAmount: 0 });
      onSuccess?.();
    } catch {
      toast({
        title: 'Failed to create order',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      orderAmount: value,
    }));
  };

  const handleCustomerChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      customerId: value,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!customerId && (
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select
              value={formData.customerId}
              onValueChange={handleCustomerChange}
              disabled={isLoadingCustomers}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingCustomers
                      ? 'Loading customers...'
                      : 'Select a customer'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Order Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.orderAmount}
            onChange={handleAmountChange}
            required
            placeholder="Enter order amount"
            autoFocus={!!customerId}
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.customerId}
            className="flex-1"
          >
            {isLoading ? 'Creating...' : 'Create Order'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
