'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShoppingCart, Search, DollarSign, Calendar, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Order, Customer } from '@/lib/types';

interface PopulatedOrderLike {
  _id: string;
  customerId: { _id: string; name?: string; email?: string } | string;
  orderAmount: number;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [ordersResponse, customersResponse] = await Promise.all([
        api.orders.getAll(),
        api.customers.getAll(),
      ]);

      // Handle different response formats
      const ordersDataRaw = Array.isArray(ordersResponse)
        ? ordersResponse
        : Array.isArray((ordersResponse as { data?: Order[] })?.data)
        ? (ordersResponse as { data: Order[] }).data
        : [];

      // Normalize orders so customerId is always a string
      const ordersData: Order[] = ordersDataRaw.map((o: unknown) => {
        if (isPopulatedOrder(o) && typeof o.customerId === 'object') {
          return { ...o, customerId: o.customerId._id } as Order;
        }
        return o as Order;
      });

      const customersData = Array.isArray(customersResponse)
        ? customersResponse
        : Array.isArray((customersResponse as { data?: Customer[] })?.data)
        ? (customersResponse as { data: Customer[] }).data
        : [];

      // Sort orders by most recent first
      const sortedOrders = ordersData.sort(
        (a: Order, b: Order) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );

      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Unable to fetch orders. Please try again.',
        variant: 'destructive',
      });
      // Set empty arrays on error
      setOrders([]);
      setFilteredOrders([]);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter((order) => {
        const customer = customers.find((c) => c._id === order.customerId);
        return (
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders, customers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  function isPopulatedOrder(o: unknown): o is PopulatedOrderLike {
    return (
      typeof o === 'object' &&
      o !== null &&
      '_id' in o &&
      'customerId' in o &&
      'orderAmount' in o &&
      'orderDate' in o
    );
  }

  const getOrderStatus = (orderDate: string, amount: number) => {
    const daysSince = Math.floor(
      (Date.now() - new Date(orderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (amount > 1000)
      return { label: 'High Value', color: 'bg-purple-100 text-purple-800' };
    if (daysSince <= 1)
      return { label: 'Recent', color: 'bg-green-100 text-green-800' };
    if (daysSince <= 7)
      return { label: 'This Week', color: 'bg-blue-100 text-blue-800' };
    if (daysSince <= 30)
      return { label: 'This Month', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Older', color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No orders yet</CardTitle>
          <CardDescription className="mb-4">
            Orders will appear here once customers start purchasing. Debug:
            isLoading={isLoading.toString()}, orders.length={orders.length}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.orderAmount,
    0
  );
  const averageOrderValue = totalRevenue / orders.length;

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Search Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by order ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length !== orders.length &&
                `${filteredOrders.length} filtered`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {filteredOrders.length} order
            {filteredOrders.length !== 1 ? 's' : ''} found • Total Revenue:{' '}
            {formatCurrency(totalRevenue)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const customer = customers.find(
                    (c) => c._id === order.customerId
                  );
                  const status = getOrderStatus(
                    order.orderDate,
                    order.orderAmount
                  );
                  return (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="font-mono text-sm">{order._id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {getCustomerName(order.customerId)}
                            </div>
                            {customer && (
                              <div className="text-sm text-muted-foreground">
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-lg">
                          {formatCurrency(order.orderAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
