import { NextResponse } from 'next/server';
import { OrderStore } from '@/lib/services/order-store';

export async function GET() {
  return NextResponse.json({ success: true, data: OrderStore.getAll() });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const order = OrderStore.create(payload);
  return NextResponse.json({ success: true, data: order });
}
