import { NextResponse } from 'next/server';
import ChannelHistoryStore from '@/lib/services/channel-history-store';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId');

    const data = campaignId ? ChannelHistoryStore.getByCampaign(campaignId) : ChannelHistoryStore.getAll();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
