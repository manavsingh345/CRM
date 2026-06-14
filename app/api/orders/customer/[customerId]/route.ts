import { NextResponse } from 'next/server';
import { OrderStore } from '@/lib/services/order-store';

export async function GET(
  req: Request,
  { params }: { params: { customerId: string } }
) {
  const orders = OrderStore.getByCustomer(params.customerId);
  return NextResponse.json({ success: true, data: orders });
}
