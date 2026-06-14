import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AdvisorPanel } from '@/components/advisor/advisor-panel';

export default function AdvisorPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">AI Campaign Advisor</h1>
          <AdvisorPanel />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
