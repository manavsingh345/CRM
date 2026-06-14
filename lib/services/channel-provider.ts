// Provider contract for channel providers (simulator or real)
import {
  CommunicationRecord,
  CommunicationSummary,
} from '@/lib/types/communications';

export interface SendMessagePayload {
  campaignId: string;
  customerId: string;
  channel: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderSendResult {
  record: CommunicationRecord;
}

export interface ChannelProvider {
  // Send a single message and return the created CommunicationRecord
  sendMessage(payload: SendMessagePayload): Promise<ProviderSendResult>;

  // Optional: send a batch of messages
  sendBatch?(payloads: SendMessagePayload[]): Promise<ProviderSendResult[]>;

  // Fetch communications for a given campaign
  getCommunicationsForCampaign(campaignId: string): Promise<CommunicationRecord[]>;

  // Fetch all communications (for analytics)
  getAllCommunications(): Promise<CommunicationRecord[]>;

  // Optional: summarize communications for analytics
  summarize?(campaignId?: string): Promise<CommunicationSummary>;
}

export default ChannelProvider;
