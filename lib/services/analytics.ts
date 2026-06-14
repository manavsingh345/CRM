import ChannelHistoryStore from '@/lib/services/channel-history-store';
import { CommunicationStatus } from '@/lib/types/communications';

export interface AnalyticsResult {
  counts: Record<string, number>;
  totals: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    read: number;
    clicked: number;
    converted: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    ctr: number;
    conversionRate: number;
  };
}

export function computeAnalyticsForCampaign(campaignId?: string): AnalyticsResult {
  const records = campaignId
    ? ChannelHistoryStore.getByCampaign(campaignId)
    : ChannelHistoryStore.getAll();

  const counts: Record<string, number> = {};
  const totals = {
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    read: 0,
    clicked: 0,
    converted: 0,
  };

  records.forEach((r) => {
    const status = r.currentStatus;
    counts[status] = (counts[status] || 0) + 1;

    if (status === CommunicationStatus.SENT) totals.sent++;
    if (status === CommunicationStatus.DELIVERED) totals.delivered++;
    if (status === CommunicationStatus.FAILED) totals.failed++;
    if (status === CommunicationStatus.OPENED) totals.opened++;
    if (status === CommunicationStatus.READ) totals.read++;
    if (status === CommunicationStatus.CLICKED) totals.clicked++;
    if (status === CommunicationStatus.CONVERTED) totals.converted++;

    // also consider history containing events (in case currentStatus is earlier/later)
    r.history.forEach((e) => {
      const s = e.status;
      counts[s] = (counts[s] || 0) + 0; // ensure key exists
    });
  });

  const sent = totals.sent + totals.delivered + totals.opened + totals.read + totals.clicked + totals.converted;
  const delivered = totals.delivered + totals.opened + totals.read + totals.clicked + totals.converted;

  const deliveryRate = sent > 0 ? delivered / sent : 0;
  const openRate = delivered > 0 ? totals.opened / delivered : 0;
  const ctr = delivered > 0 ? totals.clicked / delivered : 0;
  const conversionRate = delivered > 0 ? totals.converted / delivered : 0;

  return {
    counts,
    totals,
    rates: {
      deliveryRate,
      openRate,
      ctr,
      conversionRate,
    },
  };
}

export default computeAnalyticsForCampaign;
