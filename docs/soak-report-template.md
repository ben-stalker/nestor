# Nestor v1.0.0 — 30-Day Soak Report

**Hardware:** <!-- e.g. Intel NUC NUC7i3DNK, 8 GB RAM, Ubuntu 24.04 -->
**Start date:** <!-- YYYY-MM-DD -->
**End date:** <!-- YYYY-MM-DD -->
**Build:** <!-- git SHA or release tag -->

---

## Summary

| Metric | Value | Target |
|--------|-------|--------|
| Total runtime | XX days | 30 days |
| Uptime % | XX.XX% | ≥ 99% |
| Unplanned restarts | X | 0 |
| Systemd auto-recoveries | X | — |
| Peak memory (MB) | XXX | < 512 MB |
| Avg memory (MB) | XXX | < 250 MB |
| Final DB size (MB) | XX | — |
| Avg CPU % (idle) | X.X | < 5% |

---

## Memory Profile

<!-- Paste or link to chart generated from nestor-soak.csv -->

**Trend:** Stable / Gradual growth / Leak detected

---

## CPU Profile

<!-- Paste or link to chart -->

**Trend:** Low idle / Spikes on sync / Sustained high load

---

## Crash / Restart Log

| Timestamp | Service | Reason | Resolved by |
|-----------|---------|--------|-------------|
| — | — | — | — |

---

## Observations

<!--
- Any anomalies noted during the soak period
- Database growth rate
- Memory growth rate (flag if > 5 MB/day sustained)
- Any UI freezes, CalDAV failures, etc.
-->

---

## Verdict

- [ ] PASS — meets NFR-002 criteria; approved for v1.0 release
- [ ] FAIL — issues found; see below

**Issues (if failed):**

---

## Raw Data

CSV attachment: `nestor-soak.csv` (XXX rows, sampled hourly)

Generated with `install/scripts/soak-monitor.sh`.
