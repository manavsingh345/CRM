/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send, Users, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Segment } from '@/lib/types';
import Link from 'next/link';

interface CampaignData {
  name: string;
  segmentId: string;
  message: string;
  objective: string;
}

export function CampaignCreator() {
  const [campaign, setCampaign] = useState<CampaignData>({
    name: '',
    segmentId: '',
    message: '',
    objective: '',
  });
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [launchImmediately, setLaunchImmediately] = useState(false);
  const [isLoadingSegments, setIsLoadingSegments] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchSegments = useCallback(async () => {
    try {
      const response = await api.segments.getAll();
      // response already unwrapped (array of segments)
      const segmentsArray = Array.isArray(response) ? response : [];
      setSegments(segmentsArray);
    } catch {
      toast({
        title: 'Failed to load segments',
        description: 'Unable to fetch segments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSegments(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSegments();
    const segmentId = searchParams.get('segmentId');
    if (segmentId) {
      setCampaign((prev) => ({ ...prev, segmentId }));
    }
  }, [searchParams, fetchSegments]);

  useEffect(() => {
    if (campaign.segmentId && segments.length > 0) {
      const segment = segments.find((s) => s._id === campaign.segmentId);
      setSelectedSegment(segment || null);
    }
  }, [campaign.segmentId, segments]);

  // Improved generateSuggestions function
  const generateSuggestions = async () => {
    if (!campaign.objective.trim()) {
      toast({
        title: 'Objective is missing',
        description:
          'Please enter a campaign objective to generate suggestions.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check (optional)
    const lastGenerated = localStorage.getItem('lastSuggestionGenerated');
    const now = Date.now();
    if (lastGenerated && now - parseInt(lastGenerated) < 30000) {
      // 30 second cooldown
      toast({
        title: 'Please wait',
        description: 'You can generate suggestions again in a few seconds.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objective: campaign.objective.trim(),
          // Optional: include segment info for more targeted suggestions
          segmentName: selectedSegment?.name,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format');
      }

      setSuggestions(data.suggestions);
      localStorage.setItem('lastSuggestionGenerated', now.toString());

      toast({
        title: 'Suggestions generated',
        description: `Generated ${data.suggestions.length} message suggestions.`,
      });
    } catch (error: any) {
      console.error('Suggestion generation error:', error);

      let errorMessage = 'Could not fetch suggestions. Please try again later.';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'Server error. Please try again later.';
      }

      toast({
        title: 'Failed to generate suggestions',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createCampaign = async () => {
    if (!campaign.name || !campaign.segmentId || !campaign.message) {
      toast({
        title: 'Incomplete campaign',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newCampaign = await api.campaigns.create(campaign);
      // newCampaign is unwrapped Campaign
      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully.',
      });
      const createdId = (newCampaign as any)?._id;

      // If user opted to launch immediately, generate communications via simulator
      if (launchImmediately && createdId) {
        try {
          // Fetch customers for the selected segment
          const customers = await api.segments.getCustomers(campaign.segmentId);
          const recipientIds = Array.isArray(customers) ? customers.map((c: any) => c._id) : [];

          if (recipientIds.length > 0) {
            await fetch('/api/simulator/launch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: createdId,
                recipients: recipientIds,
                channel: 'email',
                message: campaign.message,
              }),
            });
          }
        } catch (err) {
          console.error('Launch failed:', err);
          toast({
            title: 'Launch failed',
            description: 'Campaign was created but automatic launch failed.',
            variant: 'destructive',
          });
        }
      }

      if (createdId) {
        router.push(`/campaigns/${createdId}`);
      } else {
        router.push('/campaigns');
      }
    } catch {
      toast({
        title: 'Creation failed',
        description: 'Unable to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground font-playfair">
            Create Campaign
          </h1>
          <p className="text-muted-foreground mt-2">
            Send targeted messages to your customer segments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Basic information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Summer Sale Promotion"
                  value={campaign.name}
                  onChange={(e) =>
                    setCampaign((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment-select">Target Segment *</Label>
                {isLoadingSegments ? (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                ) : (
                  <Select
                    value={campaign.segmentId}
                    onValueChange={(value) =>
                      setCampaign((prev) => ({ ...prev, segmentId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment._id} value={segment._id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{segment.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {segment.audienceSize || 0} customers
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {segments.length === 0 && !isLoadingSegments && (
                  <p className="text-sm text-muted-foreground">
                    No segments available.{' '}
                    <Link
                      href="/segments/create"
                      className="text-primary hover:underline"
                    >
                      Create one first
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
              <CardDescription>
                Write the message that will be sent to your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="campaign-objective">Campaign Objective</Label>
                <Input
                  id="campaign-objective"
                  placeholder="e.g., Re-engage inactive customers"
                  value={campaign.objective}
                  onChange={(e) =>
                    setCampaign((prev) => ({
                      ...prev,
                      objective: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="campaign-message">Message *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestions}
                    disabled={isGenerating || !campaign.objective}
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      'Generate Suggestions'
                    )}
                  </Button>
                </div>
                <Textarea
                  id="campaign-message"
                  placeholder="Write your campaign message here..."
                  rows={8}
                  value={campaign.message}
                  onChange={(e) =>
                    setCampaign((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {campaign.message.length} characters
                </p>
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-4 mt-4">
                  <Label>Suggestions</Label>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:border-primary"
                        onClick={() =>
                          setCampaign((prev) => ({
                            ...prev,
                            message: suggestion,
                          }))
                        }
                      >
                        <CardContent className="p-4 text-sm">
                          {suggestion}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Who will receive this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSegment ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedSegment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSegment.audienceSize || 0} customers
                      </p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedSegment.audienceSize || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      recipients
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Select a segment to see audience details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">
                  {campaign.name || 'Untitled Campaign'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Target</Label>
                <p className="text-sm">
                  {selectedSegment?.name || 'No segment selected'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Message Length
                </Label>
                <p className="text-sm">{campaign.message.length} characters</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Launch Immediately</Label>
                  <button
                    type="button"
                    onClick={() => setLaunchImmediately((p) => !p)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${launchImmediately ? 'bg-primary' : 'bg-muted'}`}
                    aria-pressed={launchImmediately}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${launchImmediately ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <Button
                  onClick={createCampaign}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
