import { NextResponse } from 'next/server';
import { SegmentStore } from '@/lib/services/segment-store';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const segment = SegmentStore.getById(params.id);
  if (!segment) {
    return NextResponse.json(
      { success: false, message: 'Segment not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: segment });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = await req.json();
  const updated = SegmentStore.update(params.id, payload);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Segment not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = SegmentStore.delete(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Segment not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: { message: 'Deleted segment' } });
}
