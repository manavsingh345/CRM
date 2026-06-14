import { NextResponse } from 'next/server';
import simulator from '@/lib/services/simulator-registry';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campaignId, recipients, channel = 'email', message = '', probabilities, delays } = body;

    if (!campaignId) return NextResponse.json({ success: false, message: 'campaignId required' }, { status: 400 });
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, message: 'recipients must be a non-empty array of customerIds' }, { status: 400 });
    }

    // Optional: allow override of simulator probabilities/delays by constructing a fresh simulator
    let sim = simulator as any;
    if (probabilities || delays) {
      // create a one-off simulator with custom options
      const ChannelSimulator = (await import('@/lib/services/channel-simulator')).default;
      sim = new ChannelSimulator({ probabilities, delays });
    }

    const results = [];
    for (const customerId of recipients) {
      const res = await sim.sendMessage({ campaignId, customerId, channel, content: message, metadata: {} });
      results.push(res.record);
    }

    return NextResponse.json({ success: true, data: { created: results.length, records: results } });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
