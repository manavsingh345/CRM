import { NextResponse } from 'next/server';
import { SegmentStore } from '@/lib/services/segment-store';

export async function POST(req: Request) {
  const payload = await req.json();
  const { conditions, logic } = payload;

  const audienceSize = SegmentStore.getAll().length;
  const sampleCustomers = [];

  return NextResponse.json({
    success: true,
    data: {
      audienceSize,
      sampleCustomers,
    },
  });
}
