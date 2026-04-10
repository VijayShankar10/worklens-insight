# WorkLens — AI-Powered Employee Productivity Analytics

> Track what matters. Protect privacy. Improve performance.

WorkLens is an enterprise-grade productivity analytics platform built for teams that want real insight into work patterns — without invasive monitoring. A Chrome Extension captures activity automatically in the background; a React dashboard surfaces AI-generated insights, engagement scores, and trends.

**Live Demo:** [worklens-productivity-analytics.vercel.app](https://worklens-productivity-analytics.vercel.app)
**Demo credentials:** `admin` / `admin123`

---

## Features

- **Automatic activity tracking** — Chrome Extension (Manifest V3) monitors active tabs and focus time without screenshots or keylogging
- **AI-generated insights** — Google Gemini Pro analyzes patterns and generates plain-English productivity summaries
- **Real-time dashboards** — Four chart types (bar, line, area, pie) with live updates via Supabase subscriptions
- **Engagement scoring** — Composite score per employee based on active time, interaction depth, and focus streaks
- **90-day activity heatmap** — GitHub-style heatmap showing productivity density over time
- **Email notifications** — Automated alerts for engagement drops or anomalies
- **Multi-employee view** — Admin panel with per-user drill-down

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, TailwindCSS, shadcn/ui |
| Charts | Recharts |
| Backend / DB | Supabase (PostgreSQL + Realtime) |
| AI | Google Gemini Pro API |
| Browser Extension | Chrome Extension Manifest V3 |
| Deployment | Vercel |

---

## Screenshots

<img width="1919" alt="Dashboard overview" src="https://github.com/user-attachments/assets/05c6910f-e2cb-4071-b4fd-cf1cbf8b515b" />

<img width="1919" alt="Activity heatmap" src="https://github.com/user-attachments/assets/d0d43032-3be2-4ddc-9844-c7d7ea3da49e" />

<img width="1919" alt="AI insights panel" src="https://github.com/user-attachments/assets/f1865ea4-387b-4b71-88ee-849d0f5f2220" />

<img width="1919" alt="Employee detail view" src="https://github.com/user-attachments/assets/e31d1b1d-1926-4a36-a7dc-139eb55617b4" />

<img width="1919" alt="Engagement scoring" src="https://github.com/user-attachments/assets/cc38a01c-9d4c-4605-9caf-3dd87b571db3" />

---

## Project Structure

```
worklens-insight/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Dashboard, employee views, settings
│   ├── lib/                # Supabase client, Gemini integration
│   └── hooks/              # Custom React hooks
├── extension/              # Chrome Extension source (MV3)
│   ├── manifest.json
│   ├── background.js       # Service worker — tracks active tab
│   └── content.js          # Interaction capture
└── supabase/
    └── migrations/         # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini Pro)
- Chrome browser (for the extension)

### 1. Clone and install

```bash
git clone https://github.com/VijayShankar10/worklens-insight.git
cd worklens-insight
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set up Supabase

Run the migrations in `supabase/migrations/` against your Supabase project, or use the Supabase CLI:

```bash
npx supabase db push
```

### 4. Run the web app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Install the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `extension/` folder
4. Pin the WorkLens extension to your toolbar
5. Click it to start tracking — data flows to your Supabase instance

---

## How It Works

```
Chrome Extension
  └── Monitors active tab + focus time
  └── Sends events to Supabase via REST API

Supabase (PostgreSQL + Realtime)
  └── Stores raw activity events
  └── Computes engagement scores
  └── Streams updates to the dashboard

React Dashboard
  └── Reads from Supabase
  └── Sends activity data to Gemini Pro for AI summaries
  └── Renders charts, heatmaps, scores
```

---

## Privacy

WorkLens tracks **which application/website is active and for how long** — nothing else. No screenshots, no keylogging, no content capture. All data stays in your own Supabase instance.

---

## License

MIT
