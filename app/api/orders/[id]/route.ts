import { NextResponse } from 'next/server';
import { OrderStore } from '@/lib/services/order-store';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const order = OrderStore.getById(params.id);
  if (!order) {
    return NextResponse.json(
      { success: false, message: 'Order not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: order });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = await req.json();
  const updated = OrderStore.update(params.id, payload);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Order not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = OrderStore.delete(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Order not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: { message: 'Deleted order' } });
}
