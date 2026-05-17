# STORY-13.5: EV "not plugged in" alert

**Epic:** EPIC-13: EV & Energy Module
**Status:** completed

server/src/services/evAlertService.ts: evaluateEvPlugInAlerts checks EV vehicles with plug_in_reminder_time + plug_in_reminder_days, fires info alert if time passed and no session logged today and not snoozed. Scheduler job ev-plug-in-eval registered hourly (0 * * * *). Client: PlugInReminderPanel.tsx (per-EV time + day picker, snooze tonight CTA). Full EvPage.tsx with 4 tabs (Charging / Energy / Rates / Reminders). Router updated: /ev → EvPage.
