import { NextResponse } from 'next/server';
import { CustomerStore } from '@/lib/services/customer-store';

export async function GET() {
  return NextResponse.json({ success: true, data: CustomerStore.getAll() });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const customer = CustomerStore.create(payload);
  return NextResponse.json({ success: true, data: customer });
}
