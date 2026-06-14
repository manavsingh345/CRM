import { Customer } from '@/lib/types';

const store: Map<string, Customer> = new Map([
  [
    'cust-1',
    {
      _id: 'cust-1',
      name: 'Acme Corporation',
      email: 'acme@example.com',
      phone: '+1 (555) 123-4567',
      totalSpending: 1240,
      lastVisit: '2026-06-10T12:00:00.000Z',
      createdAt: '2026-01-10T09:00:00.000Z',
      updatedAt: '2026-06-10T12:00:00.000Z',
    },
  ],
  [
    'cust-2',
    {
      _id: 'cust-2',
      name: 'Beta Logistics',
      email: 'beta@example.com',
      phone: '+1 (555) 234-5678',
      totalSpending: 620,
      lastVisit: '2026-05-28T15:30:00.000Z',
      createdAt: '2026-02-15T10:30:00.000Z',
      updatedAt: '2026-05-28T15:30:00.000Z',
    },
  ],
  [
    'cust-3',
    {
      _id: 'cust-3',
      name: 'Delta Retail',
      email: 'delta@example.com',
      phone: '+1 (555) 345-6789',
      totalSpending: 280,
      lastVisit: '2026-03-18T08:20:00.000Z',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-18T08:20:00.000Z',
    },
  ],
]);

export const CustomerStore = {
  getAll(): Customer[] {
    return Array.from(store.values());
  },

  getById(id: string): Customer | null {
    return store.get(id) ?? null;
  },

  create(data: Omit<Customer, '_id' | 'totalSpending' | 'createdAt' | 'updatedAt'>) {
    const id = `cust-${Date.now()}`;
    const now = new Date().toISOString();
    const customer: Customer = {
      _id: id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      totalSpending: 0,
      lastVisit: now,
      createdAt: now,
      updatedAt: now,
    };
    store.set(id, customer);
    return customer;
  },

  update(id: string, data: Partial<Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>>) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: Customer = {
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
