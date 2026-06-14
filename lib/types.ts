// TypeScript interfaces matching the OpenAPI specification exactly

export interface User {
  _id: string;
  name: string;
  email: string;
  googleId?: string;
  provider: 'google' | 'local';
  avatar?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpending: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  customerId: string;
  orderAmount: number;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

// CORRECTED: Matching OpenAPI Condition schema
export interface SegmentCondition {
  field: 'totalSpending' | 'lastVisit' | 'orderCount';
  operator: '>' | '<' | '=' | '>=' | '<=' | 'contains';
  value: string | number | boolean;
}

export interface Segment {
  _id: string;
  name: string;
  conditions: SegmentCondition[];
  logic: 'AND' | 'OR';
  audienceSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  name: string;
  segmentId: string | Segment; // Can be either ID string or populated segment object
  message: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// CORRECTED: Matching OpenAPI VendorResponse schema
export interface VendorResponse {
  messageId?: string;
  timestamp?: string;
  errorMessage?: string;
}

export interface CommunicationLog {
  _id: string;
  // Backend may return populated customer instead of just the ID
  customerId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
        phone?: string;
      };
  campaignId: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  vendorResponse?: VendorResponse;
  createdAt: string;
  updatedAt: string;
}

// Request types for creating/updating entities
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderRequest {
  customerId: string;
  orderAmount: number;
  orderDate?: string;
}

export interface UpdateOrderRequest {
  customerId?: string;
  orderAmount?: number;
  orderDate?: string;
}

export interface CreateSegmentRequest {
  name: string;
  conditions: SegmentCondition[];
  logic: 'AND' | 'OR';
}

export interface UpdateSegmentRequest {
  name?: string;
  conditions?: SegmentCondition[];
  logic?: 'AND' | 'OR';
}

export interface CreateCampaignRequest {
  name: string;
  segmentId: string;
  message: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  segmentId?: string;
  message?: string;
}

// ADDED: Delivery receipt request type (matching OpenAPI spec)
export interface DeliveryReceiptRequest {
  messageId: string;
  status: 'SENT' | 'FAILED';
  timestamp: string;
}

// API Response wrapper (used by your backend)
export interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
  };
  message?: string;
}

// Stats and analytics types (calculated client-side since backend doesn't provide them)
export interface CampaignStats {
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  pendingMessages: number;
  deliveryRate: number;
  audienceSize: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface DashboardStats {
  // Core counts
  totalCustomers: number;
  activeSegments: number; // segments count
  campaignsSent: number; // campaigns count
  engagementRate: number; // derived percentage

  // Recent activity (time window based)
  recentCustomers: number;
  recentSegments: number;
  recentCampaigns: number;

  // Averages / derived
  avgEngagementRate: number;

  // Growth metrics (delta % vs previous period)
  monthlyGrowth: {
    customers: number;
    segments: number;
    campaigns: number;
    engagement: number;
  };
}

// Extended types for UI (combining data from multiple endpoints)
export interface CampaignWithStats extends Campaign {
  stats: CampaignStats;
  segment?: Segment;
  segmentName?: string;
  audienceSize: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface CustomerWithOrders extends Customer {
  orders: Order[];
  orderCount: number;
}

export interface SegmentWithAudience extends Segment {
  customers?: Customer[];
  sampleCustomers?: Customer[];
}

// API Error type
export interface ApiError {
  status: number;
  message: string;
}

// Segment preview response (matching OpenAPI spec)
export interface SegmentPreviewResponse {
  audienceSize: number;
  sampleCustomers: Customer[];
}

export interface CampaignHistory {
  _id: string;
  name: string;
  segmentId: string | Segment; // Can be either ID string or populated segment object
  segmentName?: string; // Optional, if populated
  segment?: Segment; // Optional, if populated
  audienceSize?: number; // Optional, if calculated
  sent?: number; // Optional, if calculated
  failed?: number; // Optional, if calculated
  stats?: {
    sent: number;
    failed: number;
    pending: number;
  }; // Optional, if fetched
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  message: string;
  // Add other fields as necessary
}

// Re-export communication types for convenience
export { CommunicationStatus, ChannelEvent, CommunicationRecord, CommunicationSummary } from './types/communications';
