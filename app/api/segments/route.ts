import { NextResponse } from 'next/server';
import { SegmentStore } from '@/lib/services/segment-store';

export async function GET() {
  return NextResponse.json({ success: true, data: SegmentStore.getAll() });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const segment = SegmentStore.create(payload);
  return NextResponse.json({ success: true, data: segment });
}
