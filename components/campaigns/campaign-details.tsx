'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  Target,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Campaign, CommunicationLog, User, Segment } from '@/lib/types';
import Link from 'next/link';

interface CampaignDetailsProps {
  campaignId: string;
}

interface CampaignStats {
  sent: number;
  failed: number;
  pending: number;
  audienceSize: number;
  deliveryBuckets: { label: string; count: number }[];
}

interface CampaignDetailsState {
  campaign: Campaign | null;
  stats: CampaignStats | null;
  logs: CommunicationLog[];
  isLoading: boolean;
  error: string | null;
  hasInitialLoaded: boolean;
}

const DELIVERY_TIME_BUCKETS = [
  { label: '<1m', min: 0, max: 1 },
  { label: '1-5m', min: 1, max: 5 },
  { label: '5-15m', min: 5, max: 15 },
  { label: '15-60m', min: 15, max: 60 },
  { label: '>1h', min: 60, max: Infinity },
];

export function CampaignDetails({ campaignId }: CampaignDetailsProps) {
  const [state, setState] = useState<CampaignDetailsState>({
    campaign: null,
    stats: null,
    logs: [],
    isLoading: true,
    error: null,
    hasInitialLoaded: false,
  });

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<CampaignDetailsState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const calculateDeliveryBuckets = useCallback(
    (logs: CommunicationLog[]): { label: string; count: number }[] => {
      const buckets = DELIVERY_TIME_BUCKETS.map((bucket) => ({
        label: bucket.label,
        count: 0,
      }));

      logs.forEach((log) => {
        try {
          const start = new Date(log.createdAt).getTime();
          const end = new Date(
            log.vendorResponse?.timestamp || log.updatedAt || log.createdAt
          ).getTime();

          if (isNaN(start) || isNaN(end)) return;

          const diffMin = Math.max(0, (end - start) / 60000);

          const bucketIndex = DELIVERY_TIME_BUCKETS.findIndex(
            (bucket) => diffMin >= bucket.min && diffMin < bucket.max
          );

          if (bucketIndex >= 0) {
            buckets[bucketIndex].count++;
          }
        } catch (error) {
          console.warn(
            'Error calculating delivery time for log:',
            log._id,
            error
          );
        }
      });

      return buckets;
    },
    []
  );

  const calculateStats = useCallback(
    (logs: CommunicationLog[]): CampaignStats => {
      const sent = logs.filter((l) => l.deliveryStatus === 'SENT').length;
      const failed = logs.filter((l) => l.deliveryStatus === 'FAILED').length;
      const pending = logs.filter((l) => l.deliveryStatus === 'PENDING').length;
      const audienceSize = logs.length;
      const deliveryBuckets = calculateDeliveryBuckets(logs);

      return {
        sent,
        failed,
        pending,
        audienceSize,
        deliveryBuckets,
      };
    },
    [calculateDeliveryBuckets]
  );

  const fetchCampaignDetails = useCallback(
    async (isRefresh = false) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      updateState({
        isLoading: true,
        error: null,
        ...(isRefresh ? {} : { campaign: null, stats: null, logs: [] }),
      });

      try {
        if (!campaignId?.trim()) {
          throw new Error('Invalid campaign ID');
        }

        const [campaignData, communicationsData] = await Promise.all([
          api.campaigns.getById(campaignId).catch((err) => {
            if (signal.aborted) throw err;
            throw new ApiError(
              err.status || 500,
              `Failed to fetch campaign: ${err.message}`
            );
          }),
          api.communications.getByCampaign(campaignId).catch((err) => {
            if (signal.aborted) throw err;
            throw new ApiError(
              err.status || 500,
              `Failed to fetch communications: ${err.message}`
            );
          }),
        ]);

        if (signal.aborted) return;

        // Validate data
        if (!campaignData || typeof campaignData !== 'object') {
          throw new Error('Invalid campaign data received');
        }

        const logsData = Array.isArray(communicationsData?.logs)
          ? communicationsData.logs
          : [];

        const apiStats = (communicationsData as any)?.stats;

        const stats = apiStats
          ? {
              sent: apiStats.totals?.sent ?? 0,
              failed: apiStats.totals?.failed ?? 0,
              pending: 0,
              audienceSize: logsData.length,
              deliveryBuckets: calculateDeliveryBuckets(logsData),
            }
          : calculateStats(logsData);

        updateState({
          campaign: campaignData,
          stats,
          logs: logsData,
          isLoading: false,
          hasInitialLoaded: true,
          error: null,
        });
      } catch (error) {
        if (signal.aborted) return;

        const errorMessage =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        console.error('Campaign details fetch error:', error);

        updateState({
          isLoading: false,
          error: errorMessage,
          hasInitialLoaded: true,
        });

        if (!isRefresh) {
          toast({
            title: 'Failed to load campaign',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    },
    [campaignId, toast, updateState, calculateStats]
  );

  useEffect(() => {
    fetchCampaignDetails();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCampaignDetails]);

  const handleRefresh = useCallback(() => {
    fetchCampaignDetails(true);
  }, [fetchCampaignDetails]);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
        );
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
      case 'PENDING':
        return (
          <Clock
            className="w-4 h-4 text-yellow-500 animate-pulse"
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  }, []);

  // Helper function to get creator display name
  const getCreatorDisplayName = (
    createdBy: string | User | undefined
  ): string => {
    if (!createdBy) return 'Unknown';
    if (typeof createdBy === 'string') return createdBy;
    return createdBy.name || createdBy.email || createdBy._id || 'Unknown';
  };

  // Helper function to get segment display info
  const getSegmentDisplayInfo = (segmentId: string | Segment): string => {
    if (!segmentId) return 'Unknown';
    if (typeof segmentId === 'string') return segmentId;
    return segmentId.name || segmentId._id || 'Unknown';
  };

  const successRate = useMemo(() => {
    if (!state.stats || state.stats.audienceSize === 0) return '0';
    return ((state.stats.sent / state.stats.audienceSize) * 100).toFixed(1);
  }, [state.stats]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading campaign details"
    >
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Counts by communication status</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={(() => {
                  // prefer api-provided stats when available
                  const apiStats = (state as any).logs && (state as any).logs.length ? (null as any) : null;
                  // Build data from logs by aggregating currentStatus
                  const counts: Record<string, number> = {};
                  state.logs.forEach((l) => {
                    const s = (l.deliveryStatus as string) || 'UNKNOWN';
                    counts[s] = (counts[s] || 0) + 1;
                  });
                  return Object.keys(counts).map((k) => ({ status: k, count: counts[k] }));
                })()}
              >
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="text-center py-12">
      <AlertTriangle
        className="w-12 h-12 text-red-500 mx-auto mb-4"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-2">Failed to Load Campaign</h2>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        {state.error ||
          'An unexpected error occurred while loading the campaign details.'}
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
          Try Again
        </Button>
        <Button asChild variant="default">
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    </div>
  );

  // Not found state component
  const NotFoundState = () => (
    <div className="text-center py-12">
      <MessageSquare
        className="w-12 h-12 text-muted-foreground mx-auto mb-4"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-2">Campaign Not Found</h2>
      <p className="text-muted-foreground mb-4">
        The campaign you&apos;re looking for doesn&apos;t exist or may have been
        deleted.
      </p>
      <Button asChild>
        <Link href="/campaigns">Back to Campaigns</Link>
      </Button>
    </div>
  );

  // Main loading state
  if (state.isLoading && !state.hasInitialLoaded) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (state.error && !state.campaign) {
    return <ErrorState />;
  }

  // Not found state
  if (state.hasInitialLoaded && !state.campaign) {
    return <NotFoundState />;
  }

  // Should not happen, but handle gracefully
  if (!state.campaign || !state.stats) {
    return <NotFoundState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns" aria-label="Back to campaigns">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-playfair">
              {state.campaign.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Created on{' '}
              {new Date(state.campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={state.isLoading}
          aria-label="Refresh campaign details"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* Error banner for refresh errors */}
      {state.error && state.campaign && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to refresh data: {state.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatsCard
          title="Total Audience"
          value={state.stats.audienceSize}
          subtitle="customers targeted"
          icon={
            <Users
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          }
        />

        <StatsCard
          title="Successfully Sent"
          value={state.stats.sent}
          subtitle={`${successRate}% success rate`}
          icon={
            <CheckCircle
              className="h-4 w-4 text-green-500"
              aria-hidden="true"
            />
          }
          valueClassName="text-green-600"
        />

        <StatsCard
          title="Failed"
          value={state.stats.failed}
          subtitle="delivery failures"
          icon={<XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
          valueClassName="text-red-600"
        />

        <StatsCard
          title="Pending"
          value={state.stats.pending}
          subtitle="in queue"
          icon={
            <Clock className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          }
          valueClassName="text-yellow-600"
        />
      </div>

      {/* Delivery Timing Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Timing Analysis</CardTitle>
          <CardDescription>Time from creation to final status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {state.stats.deliveryBuckets.map(
              (bucket: { label: string; count: number }) => (
                <div
                  key={bucket.label}
                  className="text-center p-3 bg-muted rounded-lg"
                >
                  <div className="text-sm font-medium">{bucket.label}</div>
                  <div className="text-xl font-bold">{bucket.count}</div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign Message */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Message</CardTitle>
              <CardDescription>The message sent to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{state.campaign.message}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Campaign ID" value={state.campaign._id} isMono />
            <InfoField
              label="Created By"
              value={getCreatorDisplayName(
                state.campaign.createdBy as string | User | undefined
              )}
            />
            <InfoField
              label="Created At"
              value={new Date(state.campaign.createdAt).toLocaleString()}
              icon={
                <Calendar
                  className="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
              }
            />
            <InfoField
              label="Target Segment"
              value={getSegmentDisplayInfo(state.campaign.segmentId)}
              icon={
                <Target
                  className="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Delivery Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Logs</CardTitle>
          <CardDescription>
            Detailed delivery status for each customer ({state.logs.length}{' '}
            records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.logs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare
                className="w-8 h-8 text-muted-foreground mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">
                No delivery logs found for this campaign.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Message ID</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {typeof log.customerId === 'string'
                          ? log.customerId
                          : log.customerId._id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.deliveryStatus)}
                          <Badge className={getStatusColor(log.deliveryStatus)}>
                            {log.deliveryStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.vendorResponse?.timestamp
                          ? new Date(
                              log.vendorResponse.timestamp
                            ).toLocaleString()
                          : new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.vendorResponse?.messageId || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        {log.vendorResponse?.errorMessage || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components for better organization and reusability
interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName = '',
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isMono?: boolean;
}

function InfoField({ label, value, icon, isMono = false }: InfoFieldProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        {icon}
        <span className={`text-sm ${isMono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    </div>
  );
}
