import { NextResponse } from 'next/server';
import ChannelHistoryStore from '@/lib/services/channel-history-store';

export async function GET() {
  try {
    const records = ChannelHistoryStore.getAll();

    // Map to the CommunicationLog shape used by the frontend API
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

    return NextResponse.json({ success: true, data: logs });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
