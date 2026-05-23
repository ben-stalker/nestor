# EPIC-25: Ohme Home EV Charger Plugin

**Status:** backlog  
**Priority:** 6

## Overview

Ohme is a smart home EV charger that integrates with Octopus Energy for intelligent off-peak charging. This plugin surfaces charge session data, current state, and scheduled charge plans on the Nestor dashboard.

## Stories

### STORY-25.1: Ohme API integration

- Ohme has an unofficial REST API (reverse-engineered from the mobile app — document as `apiRisk: unofficial`)
- Plugin settings: Ohme account email + password (or OAuth token)
- `GET /api/v1/plugins/ohme/status` returns current charge state: plugged in, charging, scheduled, paused, error

### STORY-25.2: Charge session data

- Fetch completed charge sessions: date, kWh, duration, cost, tariff used
- Store in `ohme_sessions` table
- Monthly cost and kWh charts on EV screen

### STORY-25.3: Home screen widget

- Current state: "Charging · 3.2 kW · 80% by 07:00" or "Scheduled · starts 01:30"
- Tap → Ohme detail panel with session history and schedule

### STORY-25.4: Smart charge schedule display

- Pull the active smart charge plan (Ohme + Octopus Intelligent schedule)
- Display charge slots for tonight on the widget
- Alert if car is plugged in but no charge session is scheduled (possible tariff / app issue)
