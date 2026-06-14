import { Order } from '@/lib/types';

const store: Map<string, Order> = new Map([
  [
    'order-1',
    {
      _id: 'order-1',
      customerId: 'cust-1',
      orderAmount: 230,
      orderDate: '2026-06-05T07:30:00.000Z',
      status: 'completed',
      createdAt: '2026-06-05T07:30:00.000Z',
      updatedAt: '2026-06-05T07:30:00.000Z',
    },
  ],
  [
    'order-2',
    {
      _id: 'order-2',
      customerId: 'cust-2',
      orderAmount: 390,
      orderDate: '2026-06-09T14:15:00.000Z',
      status: 'pending',
      createdAt: '2026-06-09T14:15:00.000Z',
      updatedAt: '2026-06-09T14:15:00.000Z',
    },
  ],
]);

export const OrderStore = {
  getAll(): Order[] {
    return Array.from(store.values());
  },

  getById(id: string): Order | null {
    return store.get(id) ?? null;
  },

  getByCustomer(customerId: string): Order[] {
    return Array.from(store.values()).filter(
      (order) => order.customerId === customerId
    );
  },

  create(data: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>) {
    const id = `order-${Date.now()}`;
    const now = new Date().toISOString();
    const order: Order = {
      _id: id,
      customerId: data.customerId,
      orderAmount: data.orderAmount,
      orderDate: data.orderDate || now,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    store.set(id, order);
    return order;
  },

  update(id: string, data: Partial<Omit<Order, '_id' | 'createdAt' | 'updatedAt'>>) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: Order = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  delete(id: string) {
    return store.delete(id);
  },
};
