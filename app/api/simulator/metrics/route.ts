import { NextResponse } from 'next/server';
import simulator from '@/lib/services/simulator-registry';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId') ?? undefined;

    if (typeof simulator.summarize !== 'function') {
      return NextResponse.json({ success: false, message: 'summarize not supported by simulator' }, { status: 501 });
    }

    const summary = await simulator.summarize(campaignId);
    return NextResponse.json({ success: true, data: summary });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
