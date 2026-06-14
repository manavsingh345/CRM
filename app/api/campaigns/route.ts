import { NextResponse } from 'next/server';
import { CampaignStore } from '@/lib/services/campaign-store';

export async function GET() {
  return NextResponse.json({ success: true, data: CampaignStore.getAll() });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const campaign = CampaignStore.create(payload);
  return NextResponse.json({ success: true, data: campaign });
}
