// In-memory history store for communication records
import { CommunicationRecord, ChannelEvent } from '@/lib/types/communications';

const store: Map<string, CommunicationRecord> = new Map();

export const ChannelHistoryStore = {
  save(record: CommunicationRecord) {
    store.set(record._id, record);
    return record;
  },
  getById(id: string) {
    return store.get(id) ?? null;
  },
  getByCampaign(campaignId: string) {
    return Array.from(store.values()).filter((r) => r.campaignId === campaignId);
  },
  getAll() {
    return Array.from(store.values());
  },
  appendEvent(communicationId: string, event: ChannelEvent) {
    const rec = store.get(communicationId);
    if (!rec) return null;
    rec.history.push(event);
    rec.currentStatus = event.status;
    rec.statusUpdatedAt = event.timestamp;
    rec.updatedAt = event.timestamp;
    store.set(communicationId, rec);
    return rec;
  },
  clear() {
    store.clear();
  },
};

export default ChannelHistoryStore;
