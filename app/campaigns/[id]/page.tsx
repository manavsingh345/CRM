import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CampaignDetails } from '@/components/campaigns/campaign-details';

export default async function CampaignDetailsPage({
  params,
}: {
  // In Next.js 15 dynamic route params are async and must be awaited
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <MainLayout>
        <CampaignDetails campaignId={id} />
      </MainLayout>
    </ProtectedRoute>
  );
}
