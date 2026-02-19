# DART Study Monitor

A clickable prototype web application for monitoring **Developmental and Reproductive Toxicology (DART)** studies. Built to visualize live/near-real-time data from multiple ongoing DART studies using mock data modeled on SEND/SENDIG-DART concepts.

## Quick Start

```bash
# Install all dependencies
npm install

# Generate mock data
npm run generate

# Start both backend (port 3001) and frontend (port 5173)
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Individual Commands

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Generate/regenerate mock data
cd data && npx tsx generate-mock-data.ts
```

## Architecture

```
dart-study-monitor-ag/
├── backend/          # Express + TypeScript REST API
│   └── src/
│       ├── config/   # Alert thresholds
│       ├── routes/   # API endpoints
│       ├── services/ # Data loader, derived metrics, alert engine
│       └── types/    # TypeScript interfaces
├── frontend/         # React + TypeScript (Vite)
│   └── src/
│       ├── components/
│       │   ├── charts/  # LineChartByGroup, StackedBarChart, etc.
│       │   └── tabs/    # OverviewTab, MaternalTab, LitterTab, etc.
│       └── pages/       # Landing, StudyDashboard, CrossStudy
└── data/             # Mock data generator + JSON output
```

## Studies Included

| Study | Species | Type | Key Focus |
|-------|---------|------|-----------|
| **STUDY-A** | Rat (SD) | EFD | Dose-response: maternal & fetal endpoints |
| **STUDY-B** | Rabbit (NZW) | EFD | Maternal toxicity > fetal effects |
| **STUDY-C** | Rat (SD) | PPND | Pup viability, weight, milestones |

## Features

- **Landing Page** — Study overview cards with risk badges, filters (species/type/status), search
- **Study Dashboard** — Multi-tab layout with GLP/SEND provenance banners
  - Overview: Summary tiles, alerts panel, key plots
  - Maternal: Body weight, food consumption, clinical signs heatmap
  - Pregnancy & Litter: Box plots, litter summary table
  - Fetal Findings: Incidence table with litter/fetus toggle, dose-response chart
  - Postnatal Development: Pup weight by sex, milestone delay tables, neurobehavior scores
  - Animal Drill-Down: Expandable dam rows with individual charts and litter/fetal/pup data
- **Cross-Study Analytics** — DART risk profile heatmap across all studies
- **Alert Engine** — Configurable threshold-based safety signal detection
- **Data Refresh** — Simulated near-real-time updates

## Tech Stack

- **Frontend**: React 19, TypeScript, MUI 7, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript
- **Build**: Vite, tsx (dev runner)
