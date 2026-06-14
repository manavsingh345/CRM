'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function AdvisorPanel() {
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    if (!objective.trim()) {
      toast({ title: 'Enter an objective', description: 'Please enter a business objective', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setRecommendation(null);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      if (!res.ok || !data.recommendation) {
        throw new Error(data.error || 'AI failure');
      }
      setRecommendation(data.recommendation);
    } catch (err) {
      console.error(err);
      toast({ title: 'AI generation failed', description: String((err as Error).message), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createSegmentAndCampaign = async () => {
    if (!recommendation) return;
    try {
      setIsLoading(true);
      // Create segment first
      const segPayload = {
        name: recommendation.audience?.name || `AI: ${objective.slice(0, 40)}`,
        logic: recommendation.audience?.logic || 'AND',
        conditions: (recommendation.audience?.conditions || []).map((c: any) => ({ field: c.field, operator: c.operator, value: c.value })),
      };

      const newSeg = await api.segments.create(segPayload as any);
      const segId = (newSeg as any)?._id;
      if (!segId) throw new Error('Failed to create segment');

      // Create campaign
      const campPayload = { name: `AI: ${objective.slice(0, 40)}`, segmentId: segId, message: recommendation.message || '' };
      const newCamp = await api.campaigns.create(campPayload as any);

      toast({ title: 'Campaign created', description: 'AI recommendation created as campaign' });
      // Redirect to campaign details if possible
      const campId = (newCamp as any)?._id;
      if (campId) {
        window.location.href = `/campaigns/${campId}`;
      } else {
        window.location.href = '/campaigns';
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Create failed', description: String((err as Error).message), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createSegmentOnly = () => {
    if (!recommendation) return;
    const data = {
      name: recommendation.audience?.name || `AI: ${objective.slice(0, 40)}`,
      logic: recommendation.audience?.logic || 'AND',
      conditions: recommendation.audience?.conditions || [],
    };
    const q = encodeURIComponent(JSON.stringify(data));
    // Navigate to segment create page with ai data
    window.location.href = `/segments/create?aiGenerated=true&data=${q}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Campaign Advisor</CardTitle>
          <CardDescription>Enter a business objective and get an AI recommendation for audience, channel, message and expected metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Business objective</Label>
            <textarea className="w-full p-2 border rounded-md bg-background text-sm" rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} />
            <div className="flex space-x-2 mt-2">
              <Button onClick={generate} disabled={isLoading} className="flex-1">{isLoading ? 'Generating...' : 'Generate Recommendation'}</Button>
              <Link href="/campaigns"><Button variant="outline">View Campaigns</Button></Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
            <CardDescription>AI suggested campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <strong>Channel:</strong> {recommendation.channel}
              </div>
              <div>
                <strong>Message:</strong>
                <div className="p-2 bg-muted rounded mt-1">{recommendation.message}</div>
              </div>
              <div>
                <strong>Audience:</strong>
                <pre className="p-2 bg-muted rounded mt-1 text-xs">{JSON.stringify(recommendation.audience, null, 2)}</pre>
              </div>
              <div>
                <strong>Expected Metrics:</strong>
                <pre className="p-2 bg-muted rounded mt-1 text-xs">{JSON.stringify(recommendation.expectedMetrics, null, 2)}</pre>
              </div>
              <div>
                <strong>Reasoning:</strong>
                <div className="p-2 bg-muted rounded mt-1">{recommendation.reasoning}</div>
              </div>

              <div className="flex space-x-2 mt-3">
                <Button onClick={createSegmentOnly}>Create Segment</Button>
                <Button onClick={createSegmentAndCampaign} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Campaign'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
