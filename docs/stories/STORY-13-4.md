# STORY-13.4: Configurable fuel/electricity rates

**Epic:** EPIC-13: EV & Energy Module
**Status:** completed

GET/PUT /api/v1/ev/fuel-rates. FuelRateHistorySchema added to settings-keys.ts (fuel_rate_history setting). Client: FuelRatesPanel.tsx (current rates display + edit form with effective date + history list), hooks/useEnergyOverview.ts (useFuelRates, useUpdateFuelRates).
