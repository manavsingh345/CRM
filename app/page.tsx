'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Target,
  MessageSquare,
  TrendingUp,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useDashboard } from '@/hooks/use-dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats as StatsType } from '@/lib/types';

function DashboardStats({
  stats,
  isLoading,
  error,
}: {
  stats: StatsType | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatGrowth = (current: number, growth: number) => {
    if (growth === 0) return 'No change from last month';
    const period = growth > 0 ? 'increase' : 'decrease';
    return `${formatPercentage(Math.abs(growth))} ${period} from last month`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalCustomers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatGrowth(stats.totalCustomers, stats.monthlyGrowth.customers)}
          </p>
        </CardContent>
      </Card>

      {/* Active Segments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSegments}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recentSegments > 0
              ? `+${stats.recentSegments} new this week`
              : 'No new segments this week'}
          </p>
        </CardContent>
      </Card>

      {/* Campaigns Sent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.campaignsSent}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recentCampaigns > 0
              ? `+${stats.recentCampaigns} this month`
              : 'No campaigns this month'}
          </p>
        </CardContent>
      </Card>

      {/* Engagement Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.engagementRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatGrowth(stats.engagementRate, stats.monthlyGrowth.engagement)}{' '}
            from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, isLoading, error, refreshStats } = useDashboard();

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-playfair">
                Welcome to Mini CRM
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your customers, campaigns, and segments all in one place
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStats}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/segments">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Segment
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/campaigns">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <DashboardStats stats={stats} isLoading={isLoading} error={error} />

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Segments */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Build Audience Segment
                </CardTitle>
                <CardDescription>
                  Create targeted customer segments using advanced filtering
                  rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/segments">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Campaigns */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Launch Campaign
                </CardTitle>
                <CardDescription>
                  Send targeted messages to your customer segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/campaigns">Create Campaign</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Customers */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Manage Customers
                </CardTitle>
                <CardDescription>
                  View and manage your customer database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/customers">View Customers</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
