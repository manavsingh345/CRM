import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SegmentList } from "@/components/segments/segment-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SegmentsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-playfair">Customer Segments</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage targeted customer segments for your campaigns
              </p>
            </div>
            <Button asChild>
              <Link href="/segments/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Segment
              </Link>
            </Button>
          </div>
          <SegmentList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
