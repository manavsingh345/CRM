// Communication-related enums and interfaces
// This file defines the CommunicationStatus enum, ChannelEvent, CommunicationRecord,
// and summary interfaces used by the Channel Simulator and analytics layers.

export enum CommunicationStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  OPENED = 'OPENED',
  READ = 'READ',
  CLICKED = 'CLICKED',
  CONVERTED = 'CONVERTED',
  // Optional extras
  BOUNCED = 'BOUNCED',
  DEFERRED = 'DEFERRED',
}

export type EventSource = 'simulator' | 'provider' | 'system';

export interface ChannelEvent {
  status: CommunicationStatus;
  timestamp: string; // ISO 8601
  source: EventSource;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationRecord {
  _id: string;
  campaignId: string;
  customerId: string;
  channel: string; // e.g. 'sms' | 'whatsapp' | 'email'
  contentPreview?: string;
  currentStatus: CommunicationStatus;
  statusUpdatedAt: string; // ISO
  history: ChannelEvent[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationSummary {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  converted: number;

  // derived rates (0-1)
  deliveryRate: number;
  openRate: number;
  ctr: number; // click-through-rate
  conversionRate: number;
}
