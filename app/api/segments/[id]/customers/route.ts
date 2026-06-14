import { NextResponse } from 'next/server';
import { SegmentStore } from '@/lib/services/segment-store';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customers = SegmentStore.getCustomers(params.id);
  return NextResponse.json({ success: true, data: customers });
}
