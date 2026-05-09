# STORY-20.9: 30-day uptime soak test

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 10 — MVP cut completion
**Estimate:** XS (calendar wait — small effort)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** maintainer
**I want** a 30-day soak run on reference hardware
**So that** NFR-002 is validated before MVP release

---

## Acceptance Criteria

- [ ] Reference NUC i3 device runs the build for 30 days
- [ ] Memory and CPU sampled hourly via lightweight cron job
- [ ] Crash count = 0 (or systemd auto-recovery only)
- [ ] Report attached to release notes (markdown summary + raw CSV)
- [ ] Pi 5 device runs in parallel for comparative data (optional but recommended)

---

## Technical Implementation

### Files to create / modify

- `install/scripts/soak-monitor.sh` — cron-driven sampler
- `docs/soak-report-template.md`

### Implementation steps

1. Install monitor script via cron (hourly):
```bash
#!/bin/bash
ts=$(date +%s)
mem=$(free -m | awk '/Mem:/ { print $3 }')
cpu=$(top -bn1 | awk '/Cpu/ { print $2 }')
db=$(stat -c %s ~/.nestor/nestor.db)
restarts=$(systemctl show -p NRestarts nestor-server | cut -d= -f2)
echo "$ts,$mem,$cpu,$db,$restarts" >> ~/nestor-soak.csv
```
2. Set up via crontab `0 * * * *`.
3. After 30 days:
   - Aggregate CSV into chart (Python script or Excel).
   - Note any restarts in `journalctl -u nestor-server --since '30 days ago'`.
   - Author report.
4. Attach report to v1.0 release notes.
5. Reference hardware: Intel NUC i3 (8GB RAM); Pi 5 (8GB) for comparison.

### Key technical details

- NFR-002: ≥ 99% uptime, no crash-loops, memory steady.
- Ten thousand-foot expectations: idle memory ~150–250MB; CPU < 5% average; DB grows slowly.
- "Crash count = 0 (or systemd auto-recovery only)" means watchdog restarts permitted; segfaults must investigate.

---

## Dependencies

- **Blocked by:** all MVP epics
- **Blocks:** STORY-20.11 (release requires soak passed)

---

## Test Checklist

- [ ] Manual: hourly samples accumulating in CSV
- [ ] Manual: zero unexplained crashes after 30 days
- [ ] Manual: memory does not climb monotonically
- [ ] Manual: report attached to release

---

## Notes

- Soak runs in background through Sprint 10 and into Phase 2.
- Pi 5 data informs hardware guide accuracy.
