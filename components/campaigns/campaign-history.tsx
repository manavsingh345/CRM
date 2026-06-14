'use client';

import { useEffect, useState } from 'react';
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
import {
  MessageSquare,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CampaignHistory as CampaignHistoryType } from '@/lib/types';
import Link from 'next/link';

export function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<CampaignHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to get segment display name
  const getSegmentDisplayName = (campaign: CampaignHistoryType): string => {
    if (campaign.segmentName) return campaign.segmentName;
    if (campaign.segment?.name) return campaign.segment.name;
    if (typeof campaign.segmentId === 'object' && campaign.segmentId?.name) {
      return campaign.segmentId.name;
    }
    return typeof campaign.segmentId === 'string'
      ? campaign.segmentId
      : 'Unknown';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaigns = await api.campaigns.getHistory();

        // Sort by most recent first
        const sortedData = campaigns.sort(
          (a: CampaignHistoryType, b: CampaignHistoryType) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setCampaigns(sortedData);
      } catch (error) {
        console.error('Failed to fetch campaign history:', error);
        toast({
          title: 'Failed to load campaigns',
          description: 'Unable to fetch campaign history. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No campaigns yet</CardTitle>
          <CardDescription className="mb-4">
            Create your first campaign to start engaging with your customers
          </CardDescription>
          <Button asChild>
            <Link href="/campaigns/create">Create Your First Campaign</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign History</CardTitle>
        <CardDescription>
          All your campaigns sorted by most recent first
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Audience Size</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const audienceSize = campaign.audienceSize || 0;
                const sent = campaign.sent || campaign.stats?.sent || 0;
                const failed = campaign.failed || campaign.stats?.failed || 0;
                const successRate =
                  audienceSize > 0
                    ? ((sent / audienceSize) * 100).toFixed(1)
                    : '0';

                return (
                  <TableRow
                    key={campaign._id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: {getSegmentDisplayName(campaign)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{audienceSize}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{sent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>{failed}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={failed === 0 ? 'default' : 'secondary'}
                        className={
                          failed === 0 ? 'bg-green-100 text-green-800' : ''
                        }
                      >
                        {successRate}% success
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/campaigns/${campaign._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
