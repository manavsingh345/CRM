// TypeScript interfaces for AI Campaign Advisor integrations
import { CommunicationRecord } from '@/lib/types/communications';

export interface AICampaignSuggestion {
  subject?: string;
  message: string;
  tone?: string;
  length?: number;
  metadata?: Record<string, unknown>;
}

export interface AICampaignAdvisor {
  // Generate message suggestions given a campaign objective and optional segment/context
  generateMessageSuggestions(objective: string, context?: Record<string, unknown>): Promise<AICampaignSuggestion[]>;

  // Optional: generate segment rules (returns JSON serializable segment definition)
  generateSegment?(prompt: string): Promise<Record<string, unknown>>;

  // Optional: evaluate campaign performance and recommend improvements
  evaluateCampaign?(communications: CommunicationRecord[]): Promise<Record<string, any>>;
}

export default AICampaignAdvisor;
