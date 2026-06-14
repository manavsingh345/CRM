import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CampaignCreator } from "@/components/campaigns/campaign-creator"

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <CampaignCreator />
      </MainLayout>
    </ProtectedRoute>
  )
}
