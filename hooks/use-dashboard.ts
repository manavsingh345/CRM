'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { useAuth } from '@/components/auth/auth-provider';

interface UseDashboardReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const stats = await api.dashboard.getStats();
      setStats(stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard data');
      setStats({
        totalCustomers: 0,
        activeSegments: 0,
        campaignsSent: 0,
        engagementRate: 0,
        recentCustomers: 0,
        recentSegments: 0,
        recentCampaigns: 0,
        avgEngagementRate: 0,
        monthlyGrowth: {
          customers: 0,
          segments: 0,
          campaigns: 0,
          engagement: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchStats();
    }
  }, [authLoading, isAuthenticated, fetchStats]);

  return {
    stats,
    isLoading: isLoading || authLoading,
    error,
    refreshStats: fetchStats,
  };
}
