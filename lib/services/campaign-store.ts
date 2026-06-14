import { Campaign } from '@/lib/types';

const store: Map<string, Campaign> = new Map([
  [
    'camp-1',
    {
      _id: 'camp-1',
      name: 'Spring Sale Blast',
      segmentId: 'seg-1',
      message: 'Spring sale: save 20% on your next order!',
      createdBy: 'local-1',
      createdAt: '2026-03-05T11:30:00.000Z',
      updatedAt: '2026-03-05T11:30:00.000Z',
    },
  ],
]);

export const CampaignStore = {
  getAll(): Campaign[] {
    return Array.from(store.values());
  },

  getById(id: string): Campaign | null {
    return store.get(id) ?? null;
  },

  create(data: Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>) {
    const id = `camp-${Date.now()}`;
    const now = new Date().toISOString();
    const campaign: Campaign = {
      _id: id,
      name: data.name,
      segmentId: data.segmentId,
      message: data.message,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    store.set(id, campaign);
    return campaign;
  },

  update(id: string, data: Partial<Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>>) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: Campaign = {
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
