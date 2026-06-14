import { NextResponse } from 'next/server';
import { CustomerStore } from '@/lib/services/customer-store';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customer = CustomerStore.getById(params.id);
  if (!customer) {
    return NextResponse.json(
      { success: false, message: 'Customer not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: customer });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = await req.json();
  const updated = CustomerStore.update(params.id, payload);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Customer not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = CustomerStore.delete(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Customer not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: { message: 'Deleted customer' } });
}
