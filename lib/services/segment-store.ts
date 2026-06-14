import { Segment, Customer } from '@/lib/types';
import { CustomerStore } from '@/lib/services/customer-store';

const store: Map<string, Segment> = new Map([
  [
    'seg-1',
    {
      _id: 'seg-1',
      name: 'High Value Customers',
      conditions: [
        { field: 'totalSpending', operator: '>', value: 500 },
      ],
      logic: 'AND',
      audienceSize: 2,
      createdAt: '2026-01-15T11:00:00.000Z',
      updatedAt: '2026-06-01T14:45:00.000Z',
    },
  ],
  [
    'seg-2',
    {
      _id: 'seg-2',
      name: 'Recent Buyers',
      conditions: [
        { field: 'lastVisit', operator: '>', value: '2026-05-01' },
      ],
      logic: 'AND',
      audienceSize: 1,
      createdAt: '2026-02-10T09:15:00.000Z',
      updatedAt: '2026-06-05T09:15:00.000Z',
    },
  ],
]);

const segmentCustomers: Record<string, string[]> = {
  'seg-1': ['cust-1', 'cust-2'],
  'seg-2': ['cust-1'],
};

export const SegmentStore = {
  getAll(): Segment[] {
    return Array.from(store.values());
  },

  getById(id: string): Segment | null {
    return store.get(id) ?? null;
  },

  getCustomers(id: string): Customer[] {
    const customerIds = segmentCustomers[id] ?? [];
    return customerIds
      .map((customerId) => CustomerStore.getById(customerId))
      .filter((customer): customer is Customer => customer !== null);
  },

  create(data: Omit<Segment, '_id' | 'audienceSize' | 'createdAt' | 'updatedAt'>) {
    const id = `seg-${Date.now()}`;
    const now = new Date().toISOString();
    const segment: Segment = {
      _id: id,
      name: data.name,
      conditions: data.conditions,
      logic: data.logic,
      audienceSize: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.set(id, segment);
    segmentCustomers[id] = [];
    return segment;
  },

  update(id: string, data: Partial<Omit<Segment, '_id' | 'createdAt' | 'updatedAt'>>) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: Segment = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  delete(id: string) {
    delete segmentCustomers[id];
    return store.delete(id);
  },
};
