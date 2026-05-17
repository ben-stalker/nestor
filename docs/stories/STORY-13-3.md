# STORY-13.3: Energy overview dashboard

**Epic:** EPIC-13: EV & Energy Module
**Status:** completed

GET /api/v1/ev/energy-summary: this_month (ev_kwh, ev_cost_minor, electricity_units, electricity_cost_minor, gas_cost_minor, oil_cost_minor, total_cost_minor) + monthly_ev_history. Client: EnergyOverview.tsx (summary cards + 12-month bar chart), hooks/useEnergyOverview.ts.
