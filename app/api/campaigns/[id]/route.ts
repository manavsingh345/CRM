import { NextResponse } from 'next/server';
import { CampaignStore } from '@/lib/services/campaign-store';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const campaign = CampaignStore.getById(params.id);
  if (!campaign) {
    return NextResponse.json(
      { success: false, message: 'Campaign not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: campaign });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = await req.json();
  const updated = CampaignStore.update(params.id, payload);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Campaign not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = CampaignStore.delete(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Campaign not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: { message: 'Deleted campaign' } });
}
