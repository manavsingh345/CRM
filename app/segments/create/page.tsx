import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SegmentBuilder } from "@/components/segments/segment-builder"

export default function CreateSegmentPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SegmentBuilder />
      </MainLayout>
    </ProtectedRoute>
  )
}
