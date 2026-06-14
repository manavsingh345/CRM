'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateCustomerRequest } from '@/lib/types';

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: 'Name is required',
        description: 'Please enter a customer name.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Email is required',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.customers.create(formData);
      toast({
        title: 'Customer created',
        description: `${formData.name} has been added successfully.`,
      });
      setFormData({ name: '', email: '', phone: '' });
      onSuccess?.();
    } catch {
      toast({
        title: 'Failed to create customer',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof CreateCustomerRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
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
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            required
            placeholder="Enter customer name"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleChange('phone')}
            placeholder="Enter phone number"
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Creating...' : 'Create Customer'}
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
