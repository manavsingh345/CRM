<div align="center">

# ✦ Xeno Mini CRM

**An AI-native CRM for reaching shoppers — intelligently.**

*Segment audiences, generate campaigns with AI, simulate multi-channel delivery, and track performance — all in one cohesive product.*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[**Live Demo →**](https://your-deployed-url.vercel.app) &nbsp;|&nbsp; [Architecture](#architecture) &nbsp;|&nbsp; [Quick Start](#quick-start) &nbsp;|&nbsp; [AI Features](#ai-native-features)

</div>

---

## Overview

Xeno Mini CRM is a full-stack, AI-native customer relationship management platform built for Direct-to-Consumer and retail brands. It gives marketers the tools to **reach the right shoppers, with the right message, at the right time** — while surfacing the performance data to close the loop.

The system is designed around how real channel delivery actually works: a two-service, callback-driven communication loop where the CRM dispatches to a channel service, and that service asynchronously reports back what happened to each message — delivered, opened, clicked, converted.

### What it does

- **Ingest** customer profiles and order history
- **Segment** audiences using rule-based filters or natural language (AI-powered)
- **Launch campaigns** that dispatch personalised messages to a target segment across channels (Email, SMS, WhatsApp, RCS)
- **Simulate delivery** via a stubbed channel service that models a realistic full communication lifecycle asynchronously
- **Track performance** — delivery rate, open rate, click-through rate, conversion rate — at the campaign and communication level
- **AI Advisor** — describe a business objective in plain English and get back a recommended audience, channel, message, and expected performance metrics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App                          │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │   UI Layer  │   │  API Routes  │   │   AI Services   │  │
│  │  (React 19) │──▶│  (App Router)│   │  (Gemini 2.0)   │  │
│  └─────────────┘   └──────┬───────┘   └────────┬────────┘  │
│                           │                    │            │
│              ┌────────────▼──────────────────  │            │
│              │         Service Layer           │            │
│              │                                 │            │
│  ┌───────────▼──────┐  ┌────────────────────┐  │            │
│  │  Domain Stores   │  │  Channel Simulator │◀─┘            │
│  │  (Customer,      │  │  (ChannelProvider  │               │
│  │   Segment,       │  │   interface)       │               │
│  │   Campaign,      │  └────────┬───────────┘               │
│  │   Order)         │           │ async lifecycle            │
│  └──────────────────┘           │ callbacks                  │
│                       ┌─────────▼──────────┐                │
│                       │  ChannelHistoryStore│                │
│                       │  (CommunicationRecord               │
│                       │   with event log)  │                │
│                       └────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### The Communication Loop

The channel delivery loop is modelled as a two-service, callback-driven flow — the same pattern used by real channel providers (Twilio, Exotel, Gupshup):

```
CRM (campaign launch)
  │
  ▼
POST /api/simulator/launch
  │  { campaignId, recipients[], channel, message }
  │
  ▼
ChannelSimulator.sendMessage()
  │  Creates CommunicationRecord with status = SENT
  │  Returns immediately (non-blocking)
  │
  └─▶ progressLifecycle() [async, fire-and-forget]
        │
        ├─ +1s  → DELIVERED (p=0.95) or FAILED (p=0.05)
        ├─ +3s  → OPENED    (p=0.40, if delivered)
        ├─ +2s  → READ      (p=0.80, if opened)
        ├─ +4s  → CLICKED   (p=0.12, if read)
        └─ +6s  → CONVERTED (p=0.02, if clicked)
              │
              ▼
        ChannelHistoryStore.appendEvent()
        [updates currentStatus + appends to event log]
              │
              ▼
        GET /api/simulator/metrics
        [CRM polls for updated analytics]
```

Each stage transition is validated by a strict state machine (`ALLOWED_NEXT` map) ensuring no invalid transitions occur even under concurrent updates.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Persistence** | In-memory Maps | Scope of this build; production would use MongoDB/Postgres with the same Store interface |
| **Async model** | `setTimeout`-based fire-and-forget | Mirrors real webhook delay without needing a queue; production = BullMQ + Redis |
| **AI provider** | Google Gemini 2.0 Flash | Native JSON mode (`responseMimeType`) gives structured, predictable output without parsing heuristics |
| **State machine** | Linear enum with explicit transition map | Prevents impossible states; easy to extend with BOUNCED/SPAM/UNSUBSCRIBED |
| **Channel abstraction** | `ChannelProvider` interface | Swap simulator for a real SDK (Twilio, MSG91) in one line in `simulator-registry.ts` |
| **Frontend** | Next.js App Router (full-stack) | Collocates API routes and UI; reduces deploy surface area for this scope |

---

## Project Structure

```
xeno-mini-crm/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── advisor/                    # AI Campaign Advisor page
│   ├── campaigns/                  # Campaign list + detail views
│   ├── customers/                  # Customer management
│   ├── orders/                     # Order history
│   ├── segments/                   # Segment builder + preview
│   └── api/
│       ├── ai-advisor/             # POST — full campaign recommendation (Gemini)
│       ├── generate-segment/       # POST — NL → segment conditions (Gemini)
│       ├── generate-suggestions/   # POST — message copywriting variants (Gemini)
│       ├── campaigns/              # GET, POST /campaigns; GET, PATCH, DELETE /campaigns/[id]
│       ├── customers/              # CRUD for customers
│       ├── orders/                 # CRUD for orders
│       ├── segments/               # CRUD + preview endpoint
│       ├── communications/         # GET all logs; GET by campaign
│       ├── simulator/
│       │   ├── launch/             # POST — dispatch campaign to simulator
│       │   ├── communications/     # GET — all communication records
│       │   └── metrics/            # GET — aggregate analytics summary
│       └── auth/                   # Google OAuth (user, login, logout)
│
├── components/
│   ├── advisor/                    # AI Advisor panel component
│   ├── campaigns/                  # CampaignCreator, CampaignDetails, CampaignHistory
│   ├── customers/                  # Customer list + detail views
│   ├── segments/                   # Segment builder with condition editor
│   ├── layout/                     # MainLayout, Sidebar, TopNav
│   ├── auth/                       # AuthProvider, ProtectedRoute
│   └── ui/                         # shadcn/ui component library
│
└── lib/
    ├── services/
    │   ├── channel-simulator.ts    # Core: async lifecycle engine (ChannelProvider impl)
    │   ├── channel-provider.ts     # Interface contract for channel providers
    │   ├── channel-history-store.ts # Communication record store + event log
    │   ├── simulator-registry.ts   # Singleton simulator instance
    │   ├── analytics.ts            # Aggregate metrics computation
    │   ├── ai-campaign-advisor.ts  # AICampaignAdvisor interface definition
    │   ├── customer-store.ts       # In-memory customer repository
    │   ├── order-store.ts          # In-memory order repository
    │   ├── segment-store.ts        # In-memory segment repository + filtering
    │   └── campaign-store.ts       # In-memory campaign repository
    ├── types/
    │   └── communications.ts       # CommunicationStatus enum, ChannelEvent, CommunicationRecord
    ├── types.ts                    # Core domain types (Customer, Segment, Campaign, etc.)
    ├── api.ts                      # Typed API client (fetch wrappers)
    └── auth.ts                     # AuthService (Google OAuth)
```

---

## AI-Native Features

This product has AI woven into three distinct workflows — not bolted on.

### 1. AI Campaign Advisor (`/advisor`)

Describe a business goal in plain English. Gemini returns a complete, structured campaign recommendation:

```
Input:  "Re-engage customers who haven't bought in 60 days with a discount offer"

Output: {
  audience:        { logic: "AND", conditions: [{ field: "lastVisit", operator: "<", value: "2026-04-15" }] },
  channel:         "email",
  message:         "We miss you! Here's 15% off your next order — valid this week only.",
  expectedMetrics: { deliveryRate: 0.92, openRate: 0.38, ctr: 0.11, conversionRate: 0.03 },
  reasoning:       "Lapsed customers respond well to time-limited discount nudges on email..."
}
```

The recommendation can be accepted with one click — it creates the segment, creates the campaign, and navigates to launch — end to end from natural language to execution.

### 2. AI Segment Builder (`/segments/create`)

Instead of building segment rules manually, describe the audience:

```
Input:  "High-value shoppers who've spent more than ₹1000 and visited recently"
Output: { logic: "AND", conditions: [
  { field: "totalSpending", operator: ">", value: 1000 },
  { field: "lastVisit",     operator: ">", value: "2026-05-01" }
]}
```

The generated conditions are loaded into the segment builder UI for review and editing before saving.

### 3. AI Message Suggestions (`/campaigns/create`)

When composing a campaign message, describe the campaign objective and get three distinct copywriting variants, each optimised for SMS/WhatsApp length constraints (≤150 chars).

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/xeno-mini-crm.git
cd xeno-mini-crm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# .env.local

# Required: Google Gemini API key for all AI features
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Override the API base URL (defaults to http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds sample data on startup — no database setup required.

---

## API Reference

All endpoints return `{ success: boolean, data: T, message?: string }`.

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create a new campaign |
| `GET` | `/api/campaigns/[id]` | Get campaign by ID |
| `PATCH` | `/api/campaigns/[id]` | Update campaign |
| `DELETE` | `/api/campaigns/[id]` | Delete campaign |

### Simulator (Channel Service)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/simulator/launch` | Dispatch a campaign to the channel simulator |
| `GET` | `/api/simulator/communications` | Get all communication records (optionally filter by `?campaignId=`) |
| `GET` | `/api/simulator/metrics` | Get aggregated analytics summary (optionally filter by `?campaignId=`) |

**Launch Payload:**
```json
{
  "campaignId": "camp-abc123",
  "recipients": ["cust-1", "cust-2"],
  "channel": "email",
  "message": "Hey! Your exclusive offer is waiting.",
  "probabilities": { "delivery": 0.95, "open": 0.4 },
  "delays": { "deliveryMs": 1000, "openMs": 3000 }
}
```

### AI Endpoints

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/ai-advisor` | `{ objective: string }` | Full campaign recommendation |
| `POST` | `/api/generate-segment` | `{ objective: string }` | NL → segment conditions |
| `POST` | `/api/generate-suggestions` | `{ objective: string }` | 3 message copy variants |

### Segments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/segments` | List all segments |
| `POST` | `/api/segments` | Create segment |
| `GET` | `/api/segments/[id]` | Get segment by ID |
| `POST` | `/api/segments/preview` | Preview audience size for a set of conditions (dry run) |

---

## Communication Lifecycle

Every message dispatched through the simulator follows this state machine:

```
          ┌──────────────────────────────────────────────┐
          │                                              │
SENT ──▶ DELIVERED ──▶ OPENED ──▶ READ ──▶ CLICKED ──▶ CONVERTED
  │
  └──▶ FAILED
```

Terminal states: `CONVERTED`, `FAILED`, `BOUNCED`, `DEFERRED`

Each `CommunicationRecord` maintains:
- `currentStatus` — the latest state
- `history[]` — a full timestamped event log (`ChannelEvent[]`) with source and details

This design means you can reconstruct the full delivery timeline for any message, and compute engagement funnels at any granularity.

**Default simulation probabilities:**

| Transition | Probability | Delay |
|---|---|---|
| SENT → DELIVERED | 95% | ~1s |
| DELIVERED → OPENED | 40% | ~3s |
| OPENED → READ | 80% | ~2s |
| READ → CLICKED | 12% | ~4s |
| CLICKED → CONVERTED | 2% | ~6s |

Probabilities and delays are fully configurable per `POST /api/simulator/launch`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| AI | [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) via `@google/genai` |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Fonts | [Geist](https://vercel.com/font) (sans + mono) + Playfair Display |
| Auth | Google OAuth (session-based) |
| Runtime | Node.js 18+ |

---

## Scale Assumptions & Tradeoffs

This build is scoped as a working demonstration. Here is what would change at production scale:

**Persistence:** In-memory Maps reset on restart. At scale: MongoDB for documents (customers, campaigns, orders), Redis for the ChannelHistoryStore (fast append + TTL on old records).

**Async delivery:** `setTimeout` fire-and-forget works for demo. At scale: a proper job queue (BullMQ + Redis) with retry logic, dead-letter queues, and backpressure on burst sends.

**Channel service separation:** The simulator runs in-process. At scale: the channel service is a separate deployed microservice (or a third-party SDK). The `ChannelProvider` interface is already designed for this — one line changes in `simulator-registry.ts`.

**AI calls:** Direct Gemini calls from API routes with no caching. At scale: rate limiting, request deduplication, and response caching for identical objectives.

**Segmentation:** Segment evaluation runs in-process over the in-memory store. At scale: push segment rules to the database as a query (MongoDB aggregation pipeline or SQL WHERE clause), not in-app filtering.

---

## Roadmap

- [ ] Persistent storage (MongoDB adapter behind Store interfaces)
- [ ] Real-time campaign analytics via WebSocket / SSE (live stats as simulator progresses)
- [ ] Webhook receipt endpoint for external channel providers (true two-service separation)
- [ ] Segment scheduling — run a campaign on a cron schedule
- [ ] Bulk customer import (CSV/XLSX)
- [ ] Multi-tenant support (workspace isolation)
- [ ] Campaign A/B testing (split audience across message variants)

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

```bash
# Fork and clone
git checkout -b feature/your-feature-name

# Make changes, then
npm run lint
npm run build   # Verify no type errors

# Open a pull request
```

---

## License

[MIT](./LICENSE)

---

<div align="center">

Built as part of the [Xeno](https://www.xeno.so/) Engineering Take-Home Assignment · June 2026

</div>
