// Segment list component
'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Target,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Segment } from '@/lib/types';
import Link from 'next/link';

export function SegmentList() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSegments = useCallback(async () => {
    try {
      const response = await api.segments.getAll();
      const segmentsArray = Array.isArray(response) ? response : [];
      setSegments(segmentsArray);
    } catch {
      toast({
        title: 'Failed to load segments',
        description: 'Unable to fetch segments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const deleteSegment = async (id: string) => {
    try {
      await api.segments.delete(id);
      setSegments((prev) => prev.filter((segment) => segment._id !== id));
      toast({
        title: 'Segment deleted',
        description: 'The segment has been removed successfully.',
      });
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Unable to delete segment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const previewAudience = async (segment: Segment) => {
    try {
      const audience = await api.segments.getCustomers(segment._id);
      toast({
        title: 'Audience Preview',
        description: `"${segment.name}" targets ${audience.length} customers.`,
      });
    } catch {
      toast({
        title: 'Preview failed',
        description: 'Unable to preview audience. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No segments yet</CardTitle>
          <CardDescription className="mb-4">
            Create your first customer segment to start targeting specific
            groups
          </CardDescription>
          <Button asChild>
            <Link href="/segments/create">Create Your First Segment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {segments.map((segment) => (
        <Card key={segment._id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{segment.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {new Date(segment.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => previewAudience(segment)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Audience
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/campaigns/create?segmentId=${segment._id}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteSegment(segment._id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {segment.audienceSize || 'Unknown'} customers
                </span>
              </div>
              <Badge variant="secondary">{segment.logic}</Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Conditions:</div>
              <div className="space-y-1">
                {segment.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground bg-muted p-2 rounded"
                  >
                    {condition.field} {condition.operator} {condition.value}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewAudience(segment)}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href={`/campaigns/create?segmentId=${segment._id}`}>
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Campaign
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
