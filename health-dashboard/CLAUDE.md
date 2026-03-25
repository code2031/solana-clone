# SolClone Health Dashboard

Repository: https://github.com/code2031/solana-clone

## Build

```bash
npm install          # install dependencies
npm run dev          # start dev server on :3000
npm run build        # production build
npm run lint         # run ESLint
npm test             # run test suite
```

## Key Files

- `app/page.tsx` -- Dashboard layout with stat cards and chart panels
- `components/TpsGauge.tsx` -- Real-time TPS gauge visualization
- `components/ValidatorTable.tsx` -- Active/delinquent validator listing
- `components/EpochProgress.tsx` -- Epoch progress bar with time estimate
- `components/PerformanceChart.tsx` -- Historical TPS and slot time charts (Recharts)
- `hooks/useClusterStats.ts` -- SWR hook polling RPC every 2 seconds
- `lib/rpc-client.ts` -- SolClone RPC client wrapper
- `next.config.ts` -- Next.js configuration

## Architecture

Next.js App Router application. A central SWR hook (`useClusterStats`) polls multiple
RPC methods every 2 seconds and caches results. Components subscribe to this hook
and render stat cards, tables, and Recharts time-series graphs.

Data flow: RPC endpoint -> SWR fetcher -> useClusterStats hook -> UI components.
Historical data points are accumulated in a ring buffer (default 300 entries) for
chart rendering. The network selector switches the RPC URL and clears the buffer.

## Environment Variables

- `RPC_URL` -- SolClone RPC endpoint (default: `http://localhost:8899`)
- `POLL_INTERVAL` -- Polling interval in ms (default: `2000`)
- `HISTORY_WINDOW` -- Data points retained for charts (default: `300`)
