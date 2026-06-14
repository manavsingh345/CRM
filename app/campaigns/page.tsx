import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CampaignHistory } from "@/components/campaigns/campaign-history"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-playfair">Campaign History</h1>
              <p className="text-muted-foreground mt-2">View and manage all your marketing campaigns</p>
            </div>
            <Button asChild>
              <Link href="/campaigns/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>
          <CampaignHistory />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
