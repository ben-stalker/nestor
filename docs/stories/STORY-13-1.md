# STORY-13.1: EV charging log schema + repo

**Epic:** EPIC-13: EV & Energy Module
**Status:** completed

Migration 019_ev_charging.sql, server/src/types/ev.ts, EvChargingRepository (CRUD + listForMonth + monthlyTotals). Vehicles table extended with plug_in_reminder_time/days/snoozed_until. VehicleRepository.fromRow and VehicleUpdateSchema updated.
