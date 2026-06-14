'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Eye, Save, ArrowLeft, Sparkles, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SegmentCondition, CreateSegmentRequest } from '@/lib/types';
import Link from 'next/link';

type DraftSegmentCondition = {
  field: '' | SegmentCondition['field'];
  operator: '' | SegmentCondition['operator'];
  value: '' | SegmentCondition['value'];
};

interface SegmentData {
  name: string;
  conditions: DraftSegmentCondition[];
  logic: 'AND' | 'OR';
}

const FIELD_OPTIONS = [
  { value: 'totalSpending', label: 'Total Spending', type: 'number' },
  { value: 'lastVisit', label: 'Last Visit Date', type: 'date' },
  { value: 'name', label: 'Customer Name', type: 'text' },
  { value: 'email', label: 'Email Address', type: 'text' },
];

const OPERATOR_OPTIONS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' },
  { value: '=', label: 'Equal to' },
  { value: '!=', label: 'Not equal to' },
];

export function SegmentBuilder() {
  const [segment, setSegment] = useState<SegmentData>({
    name: '',
    conditions: [{ field: '', operator: '', value: '' }],
    logic: 'AND',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  // Auto campaign creation state
  const [createCampaign, setCreateCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState(
    'Hi {{name}}, here’s 10% off on your next order!'
  );
  const [isCampaignCreating, setIsCampaignCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const aiGenerated = searchParams.get('aiGenerated');
    const data = searchParams.get('data');

    if (aiGenerated === 'true' && data) {
      try {
        const parsedData = JSON.parse(data);
        setSegment(parsedData);
        setIsAIGenerated(true);
        toast({
          title: 'AI segment loaded',
          description:
            'Your AI-generated segment has been loaded. Review and save when ready.',
        });
      } catch {
        toast({
          title: 'Failed to load AI segment',
          description: 'There was an error loading the AI-generated segment.',
          variant: 'destructive',
        });
      }
    }
  }, [searchParams, toast]);

  const addCondition = () => {
    setSegment((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '', value: '' }],
    }));
  };

  const removeCondition = (index: number) => {
    if (segment.conditions.length > 1) {
      setSegment((prev) => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index),
      }));
    }
  };

  const updateCondition = (
    index: number,
    field: keyof SegmentCondition,
    value: string | number
  ) => {
    setSegment((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const previewAudience = async () => {
    if (
      !segment.name ||
      segment.conditions.some(
        (c) => !c.field || !c.operator || c.value === null || c.value === ''
      )
    ) {
      toast({
        title: 'Incomplete segment',
        description:
          'Please fill in all fields before previewing the audience.',
        variant: 'destructive',
      });
      return;
    }

    setIsPreviewLoading(true);
    try {
      // Prepare data for preview
      const previewData = {
        name: segment.name,
        conditions: segment.conditions.map((c) => ({
          field: c.field as SegmentCondition['field'],
          operator: c.operator as SegmentCondition['operator'],
          value: c.value as SegmentCondition['value'],
        })),
        logic: segment.logic,
      };

      // Call backend preview endpoint
      const result = await api.segments.preview(previewData);

      setAudienceSize(result.audienceSize);

      toast({
        title: 'Audience Preview',
        description: `This segment would target ${result.audienceSize} customers.`,
      });
    } catch {
      toast({
        title: 'Preview failed',
        description: 'Unable to preview audience. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const saveSegment = async () => {
    if (
      !segment.name ||
      segment.conditions.some((c) => !c.field || !c.operator || c.value === '')
    ) {
      toast({
        title: 'Incomplete segment',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateSegmentRequest = {
        name: segment.name,
        logic: segment.logic,
        conditions: segment.conditions.map((c) => ({
          field: c.field as SegmentCondition['field'],
          operator: c.operator as SegmentCondition['operator'],
          value: c.value as SegmentCondition['value'],
        })),
      };
      const newSegment = await api.segments.create(payload);
      toast({
        title: 'Segment created',
        description: 'Your customer segment has been saved successfully.',
      });

      // If auto campaign creation enabled and we have a new segment id
      if (
        createCampaign &&
        newSegment &&
        (newSegment as { _id?: string })._id
      ) {
        if (!campaignName || !campaignMessage) {
          toast({
            title: 'Campaign details missing',
            description:
              'Provide a campaign name and message or disable auto campaign.',
            variant: 'destructive',
          });
          router.push('/campaigns');
          return;
        }
        try {
          setIsCampaignCreating(true);
          const segmentId = (newSegment as { _id?: string })._id || '';
          const createdCampaign = await api.campaigns.create({
            name: campaignName,
            segmentId,
            message: campaignMessage,
          });
          toast({
            title: 'Campaign created',
            description: 'Campaign launched for this new segment.',
          });
          if (createdCampaign && (createdCampaign as { _id?: string })._id) {
            router.push(
              `/campaigns/${(createdCampaign as { _id?: string })._id}`
            );
          } else {
            router.push('/campaigns');
          }
          return; // exit early after redirect
        } catch {
          toast({
            title: 'Campaign creation failed',
            description:
              'Segment saved but campaign could not be created. You can create it manually later.',
            variant: 'destructive',
          });
          router.push('/campaigns');
          return;
        } finally {
          setIsCampaignCreating(false);
        }
      }

      // Default redirect when not creating campaign
      router.push('/campaigns');
    } catch {
      toast({
        title: 'Save failed',
        description: 'Unable to save segment. Please try again.',
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
          <Link href="/segments">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-foreground font-playfair">
              Create Customer Segment
            </h1>
            {isAIGenerated && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            {isAIGenerated
              ? 'Review your AI-generated segment rules and save when ready'
              : 'Define rules to target specific customer groups'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Segment Name */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Details</CardTitle>
              <CardDescription>
                Give your segment a descriptive name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input
                  id="segment-name"
                  placeholder="e.g., High-Value Customers"
                  value={segment.name}
                  onChange={(e) =>
                    setSegment((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Segment Builder */}
          <Card>
            <CardHeader>
              <CardTitle>AI Segment Builder</CardTitle>
              <CardDescription>
                Describe the audience in plain English and hit Generate to auto-create rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">AI Prompt</Label>
                <textarea
                  className="w-full p-2 border rounded-md bg-background text-sm"
                  rows={3}
                  placeholder={`e.g. Find customers who spent more than ₹5000 and have not purchased in 60 days`}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />

                <div className="flex space-x-2">
                  <Button
                    onClick={async () => {
                      if (!aiPrompt.trim()) {
                        toast({ title: 'Enter an objective', description: 'Please provide a natural-language objective for the AI.', variant: 'destructive' });
                        return;
                      }

                      setIsAiGenerating(true);
                      try {
                        const res = await fetch('/api/generate-segment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ objective: aiPrompt }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.segment) {
                          throw new Error(data.error || 'AI failed');
                        }

                        // Map AI segment to local SegmentData shape
                        const aiSeg = data.segment as any;
                        const mapped = {
                          name: aiSeg.name || aiPrompt.slice(0, 60),
                          logic: aiSeg.logic === 'OR' ? 'OR' : 'AND',
                          conditions: (aiSeg.conditions || []).map((c: any) => ({
                            field: c.field || '',
                            operator: c.operator || '',
                            value: c.value === null || c.value === undefined ? '' : String(c.value),
                          })),
                        } as SegmentData;

                        setSegment(mapped);
                        setIsAIGenerated(true);
                        toast({ title: 'AI segment generated', description: 'Review and save the generated rules.' });
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'AI generation failed', description: String((err as Error).message), variant: 'destructive' });
                      } finally {
                        setIsAiGenerating(false);
                      }
                    }}
                    disabled={isAiGenerating}
                    className="flex-1"
                  >
                    {isAiGenerating ? 'Generating...' : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" /> Generate
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiPrompt('');
                      setIsAIGenerated(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Rules</CardTitle>
              <CardDescription>
                Define the conditions that customers must meet to be included
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logic Selector */}
              <div className="flex items-center space-x-4">
                <Label>Combine rules with:</Label>
                <Select
                  value={segment.logic}
                  onValueChange={(value: 'AND' | 'OR') =>
                    setSegment((prev) => ({ ...prev, logic: value }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                {segment.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Field */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Field
                        </Label>
                        <Select
                          value={condition.field || ''}
                          onValueChange={(value) =>
                            updateCondition(index, 'field', value || '')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_OPTIONS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Operator
                        </Label>
                        <Select
                          value={condition.operator || ''}
                          onValueChange={(value) =>
                            updateCondition(index, 'operator', value || '')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((operator) => (
                              <SelectItem
                                key={operator.value}
                                value={operator.value}
                              >
                                {operator.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Value
                        </Label>
                        {(() => {
                          const fieldType = FIELD_OPTIONS.find(
                            (f) => f.value === condition.field
                          )?.type;

                          if (fieldType === 'date') {
                            return (
                              <Input
                                type="date"
                                placeholder="Select date"
                                value={
                                  typeof condition.value === 'string' ||
                                  typeof condition.value === 'number'
                                    ? String(condition.value)
                                    : ''
                                }
                                onChange={(e) =>
                                  updateCondition(
                                    index,
                                    'value',
                                    e.target.value
                                  )
                                }
                              />
                            );
                          } else if (fieldType === 'number') {
                            return (
                              <Input
                                type="number"
                                placeholder="Enter value"
                                value={
                                  typeof condition.value === 'string' ||
                                  typeof condition.value === 'number'
                                    ? String(condition.value)
                                    : ''
                                }
                                onChange={(e) =>
                                  updateCondition(
                                    index,
                                    'value',
                                    Number.parseFloat(e.target.value) ?? null
                                  )
                                }
                              />
                            );
                          } else {
                            return (
                              <Input
                                type="text"
                                placeholder="Enter value"
                                value={
                                  typeof condition.value === 'string' ||
                                  typeof condition.value === 'number'
                                    ? String(condition.value)
                                    : ''
                                }
                                onChange={(e) =>
                                  updateCondition(
                                    index,
                                    'value',
                                    e.target.value
                                  )
                                }
                              />
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {/* Remove button */}
                    {segment.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Logic indicator */}
                    {index < segment.conditions.length - 1 && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <Badge variant="secondary" className="text-xs">
                          {segment.logic}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addCondition}
                  className="w-full bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience Preview</CardTitle>
              <CardDescription>
                See how many customers match your segment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={previewAudience}
                disabled={isPreviewLoading}
                className="w-full"
              >
                {isPreviewLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Audience
                  </>
                )}
              </Button>

              {audienceSize !== null && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {audienceSize}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    customers match this segment
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">
                  {segment.name || 'Untitled Segment'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Conditions
                </Label>
                <p className="text-sm">
                  {segment.conditions.length} rule(s) with {segment.logic} logic
                </p>
              </div>
              {isAIGenerated && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Source
                  </Label>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <p className="text-sm text-purple-600">Generated by AI</p>
                  </div>
                </div>
              )}
              <Separator />
              {/* Auto Campaign Creation Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Auto-create Campaign
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCreateCampaign((p) => !p)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      createCampaign ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-pressed={createCampaign}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        createCampaign ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {createCampaign && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Campaign Name
                      </Label>
                      <Input
                        placeholder="e.g., New Segment Launch Promo"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Message Template
                      </Label>
                      <textarea
                        className="w-full text-sm p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                        value={campaignMessage}
                        onChange={(e) => setCampaignMessage(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use {'{'}
                        {'{'}name{'}'}
                        {'}'} placeholder for personalization.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <Button
                onClick={saveSegment}
                disabled={isLoading || isCampaignCreating}
                className="w-full"
              >
                {isLoading || isCampaignCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>
                      {isCampaignCreating
                        ? 'Creating Campaign...'
                        : 'Saving...'}
                    </span>
                  </div>
                ) : (
                  <>
                    {createCampaign ? (
                      <Send className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {createCampaign ? 'Save & Launch Campaign' : 'Save Segment'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
