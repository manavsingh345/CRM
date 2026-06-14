// Channel Simulator - provider-agnostic implementation
import ChannelProvider, { SendMessagePayload, ProviderSendResult } from '@/lib/services/channel-provider';
import { CommunicationRecord, CommunicationStatus, ChannelEvent } from '@/lib/types/communications';
import ChannelHistoryStore from '@/lib/services/channel-history-store';

export interface SimulatorProbabilities {
  delivery?: number; // prob that SENT -> DELIVERED (vs FAILED)
  open?: number; // prob that DELIVERED -> OPENED
  read?: number; // prob that OPENED -> READ
  click?: number; // prob that READ -> CLICKED
  convert?: number; // prob that CLICKED -> CONVERTED
}

export interface SimulatorDelays {
  deliveryMs?: number; // time after SENT to decide delivery (ms)
  openMs?: number;
  readMs?: number;
  clickMs?: number;
  convertMs?: number;
}

export interface ChannelSimulatorOptions {
  probabilities?: SimulatorProbabilities;
  delays?: SimulatorDelays;
}

const DEFAULT_PROBS: Required<SimulatorProbabilities> = {
  delivery: 0.95,
  open: 0.4,
  read: 0.8,
  click: 0.12,
  convert: 0.02,
};

const DEFAULT_DELAYS: Required<SimulatorDelays> = {
  deliveryMs: 1000,
  openMs: 3000,
  readMs: 2000,
  clickMs: 4000,
  convertMs: 6000,
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// Allowed linear state machine transitions
const ALLOWED_NEXT: Record<CommunicationStatus, CommunicationStatus[]> = {
  [CommunicationStatus.SENT]: [CommunicationStatus.DELIVERED, CommunicationStatus.FAILED],
  [CommunicationStatus.DELIVERED]: [CommunicationStatus.OPENED],
  [CommunicationStatus.OPENED]: [CommunicationStatus.READ],
  [CommunicationStatus.READ]: [CommunicationStatus.CLICKED],
  [CommunicationStatus.CLICKED]: [CommunicationStatus.CONVERTED],
  [CommunicationStatus.CONVERTED]: [],
  [CommunicationStatus.FAILED]: [],
  [CommunicationStatus.BOUNCED]: [],
  [CommunicationStatus.DEFERRED]: [],
};

function isAllowedTransition(from: CommunicationStatus, to: CommunicationStatus) {
  const allowed = ALLOWED_NEXT[from] || [];
  return allowed.includes(to);
}

export class ChannelSimulator implements ChannelProvider {
  private probs: Required<SimulatorProbabilities>;
  private delays: Required<SimulatorDelays>;

  constructor(opts?: ChannelSimulatorOptions) {
    this.probs = { ...DEFAULT_PROBS, ...(opts?.probabilities ?? {}) };
    this.delays = { ...DEFAULT_DELAYS, ...(opts?.delays ?? {}) };
  }

  async sendMessage(payload: SendMessagePayload): Promise<ProviderSendResult> {
    const now = nowIso();
    const record: CommunicationRecord = {
      _id: makeId(),
      campaignId: payload.campaignId,
      customerId: payload.customerId,
      channel: payload.channel,
      contentPreview: payload.content?.slice(0, 200),
      currentStatus: CommunicationStatus.SENT,
      statusUpdatedAt: now,
      history: [
        { status: CommunicationStatus.SENT, timestamp: now, source: 'simulator', details: 'Initial SENT' },
      ],
      metadata: payload.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    // persist initial record
    ChannelHistoryStore.save(record);

    // kick off asynchronous lifecycle progression (fire-and-forget)
    this.progressLifecycle(record._id).catch((err) => {
      // keep failures from bubbling up; log to history
      const ts = nowIso();
      ChannelHistoryStore.appendEvent(record._id, {
        status: CommunicationStatus.DEFERRED,
        timestamp: ts,
        source: 'system',
        details: `Lifecycle error: ${String(err)}`,
      });
    });

    return { record };
  }

  async sendBatch(payloads: SendMessagePayload[]): Promise<ProviderSendResult[]> {
    const promises = payloads.map((p) => this.sendMessage(p));
    return Promise.all(promises);
  }

  async getCommunicationsForCampaign(campaignId: string) {
    return ChannelHistoryStore.getByCampaign(campaignId);
  }

  async getAllCommunications() {
    return ChannelHistoryStore.getAll();
  }

  async summarize?(campaignId?: string) {
    const list = campaignId ? ChannelHistoryStore.getByCampaign(campaignId) : ChannelHistoryStore.getAll();
    const summary = {
      sent: list.length,
      delivered: list.filter((r) => r.currentStatus === CommunicationStatus.DELIVERED || r.history.some((e) => e.status === CommunicationStatus.DELIVERED)).length,
      failed: list.filter((r) => r.currentStatus === CommunicationStatus.FAILED || r.history.some((e) => e.status === CommunicationStatus.FAILED)).length,
      opened: list.filter((r) => r.currentStatus === CommunicationStatus.OPENED || r.history.some((e) => e.status === CommunicationStatus.OPENED)).length,
      read: list.filter((r) => r.currentStatus === CommunicationStatus.READ || r.history.some((e) => e.status === CommunicationStatus.READ)).length,
      clicked: list.filter((r) => r.currentStatus === CommunicationStatus.CLICKED || r.history.some((e) => e.status === CommunicationStatus.CLICKED)).length,
      converted: list.filter((r) => r.currentStatus === CommunicationStatus.CONVERTED || r.history.some((e) => e.status === CommunicationStatus.CONVERTED)).length,
      deliveryRate: 0,
      openRate: 0,
      ctr: 0,
      conversionRate: 0,
    } as any;

    summary.deliveryRate = summary.sent > 0 ? summary.delivered / summary.sent : 0;
    summary.openRate = summary.delivered > 0 ? summary.opened / summary.delivered : 0;
    summary.ctr = summary.delivered > 0 ? summary.clicked / summary.delivered : 0;
    summary.conversionRate = summary.delivered > 0 ? summary.converted / summary.delivered : 0;

    return summary;
  }

  // Primary lifecycle progression: SENT -> (DELIVERED|FAILED) -> OPENED -> READ -> CLICKED -> CONVERTED
  private async progressLifecycle(communicationId: string) {
    // 1) delivery decision
    await this.delay(this.delays.deliveryMs);
    const deliveryRoll = Math.random();
    const delivered = deliveryRoll < this.probs.delivery;
    const tsDelivery = nowIso();
    const current = ChannelHistoryStore.getById(communicationId);
    if (!current) return;
    if (!isAllowedTransition(current.currentStatus, delivered ? CommunicationStatus.DELIVERED : CommunicationStatus.FAILED)) {
      // invalid state; stop
      return;
    }

    ChannelHistoryStore.appendEvent(communicationId, {
      status: delivered ? CommunicationStatus.DELIVERED : CommunicationStatus.FAILED,
      timestamp: tsDelivery,
      source: 'simulator',
      details: delivered ? 'Delivered by simulator' : 'Delivery failed (simulated)',
    });

    if (!delivered) return; // stop on failure

    // 2) opened
    await this.delay(this.delays.openMs);
    if (Math.random() < this.probs.open) {
      const tsOpened = nowIso();
      if (isAllowedTransition(ChannelHistoryStore.getById(communicationId)!.currentStatus, CommunicationStatus.OPENED)) {
        ChannelHistoryStore.appendEvent(communicationId, {
          status: CommunicationStatus.OPENED,
          timestamp: tsOpened,
          source: 'simulator',
          details: 'User opened message (simulated)',
        });
      }

      // 3) read
      await this.delay(this.delays.readMs);
      if (Math.random() < this.probs.read) {
        const tsRead = nowIso();
        if (isAllowedTransition(ChannelHistoryStore.getById(communicationId)!.currentStatus, CommunicationStatus.READ)) {
          ChannelHistoryStore.appendEvent(communicationId, {
            status: CommunicationStatus.READ,
            timestamp: tsRead,
            source: 'simulator',
            details: 'User read message (simulated)',
          });
        }

        // 4) clicked
        await this.delay(this.delays.clickMs);
        if (Math.random() < this.probs.click) {
          const tsClick = nowIso();
          if (isAllowedTransition(ChannelHistoryStore.getById(communicationId)!.currentStatus, CommunicationStatus.CLICKED)) {
            ChannelHistoryStore.appendEvent(communicationId, {
              status: CommunicationStatus.CLICKED,
              timestamp: tsClick,
              source: 'simulator',
              details: 'User clicked link (simulated)',
            });
          }

          // 5) converted
          await this.delay(this.delays.convertMs);
          if (Math.random() < this.probs.convert) {
            const tsConv = nowIso();
            if (isAllowedTransition(ChannelHistoryStore.getById(communicationId)!.currentStatus, CommunicationStatus.CONVERTED)) {
              ChannelHistoryStore.appendEvent(communicationId, {
                status: CommunicationStatus.CONVERTED,
                timestamp: tsConv,
                source: 'simulator',
                details: 'User converted (simulated)',
              });
            }
          }
        }
      }
    }
  }

  private delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

export default ChannelSimulator;
