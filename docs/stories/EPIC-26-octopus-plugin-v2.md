# EPIC-26: Octopus Energy Plugin v2 — Full Home Energy Dashboard

**Status:** backlog  
**Priority:** 7

## Overview

The existing Octopus implementation covers basic usage data. This epic builds the full home energy consumption dashboard per PRD Section 17: live smart meter data, tariff display, cost breakdown, and Agile/Intelligent tariff rate visualisation.

## Stories

### STORY-26.1: Smart meter live data

- Octopus API: `GET /v1/electricity-meter-points/{mpan}/meters/{serial}/consumption/`
- Half-hourly consumption data for electricity and gas
- Store in `octopus_readings` table (mpan, serial, interval_start, interval_end, consumption)
- Auto-sync every 30 minutes

### STORY-26.2: Energy dashboard — EV screen

- Today's electricity usage: kWh bar chart (half-hourly)
- This month vs last month: line chart
- Cost breakdown: import cost, export earnings (if solar/battery), standing charge
- Gas consumption chart (if gas account linked)

### STORY-26.3: Agile/Intelligent tariff display

- Fetch upcoming unit rates (Agile: 48 half-hour slots ahead)
- Rate timeline chart: green (cheap), amber (normal), red (expensive)
- Current rate displayed prominently on widget
- "Best time to run appliances" callout (cheapest 3-hour window today)

### STORY-26.4: Home screen widget

- Current import rate (p/kWh)
- Today's spend so far
- Live consumption indicator (if smart meter supports live data via SMETS2/IHD)
- Tap → full energy dashboard

### STORY-26.5: Alerts

- "Cheap rate starts in 30 minutes" — configurable alert for Agile users
- Monthly spend approaching budget threshold (uses energy budget from House settings)
- Meter reading reminder on configured date (if no smart meter)
