import { NextResponse } from 'next/server';
import ChannelHistoryStore from '@/lib/services/channel-history-store';
import { computeAnalyticsForCampaign } from '@/lib/services/analytics';

export async function GET(req: Request, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params;
    const records = ChannelHistoryStore.getByCampaign(campaignId);

    const logs = records.map((r) => ({
      _id: r._id,
      customerId: r.customerId,
      campaignId: r.campaignId,
      deliveryStatus: r.currentStatus,
      vendorResponse: {
        messageId: r._id,
        timestamp: r.statusUpdatedAt,
      },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    const stats = computeAnalyticsForCampaign(campaignId);

    return NextResponse.json({ success: true, data: { logs, stats } });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
