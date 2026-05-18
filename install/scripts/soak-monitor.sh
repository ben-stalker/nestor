#!/usr/bin/env bash
# Hourly soak-test sampler — run via cron: 0 * * * * /path/to/soak-monitor.sh
# Appends one CSV row per invocation to ~/nestor-soak.csv
# Columns: timestamp_unix,mem_used_mb,cpu_pct,db_size_bytes,server_restarts,client_restarts
set -euo pipefail

CSV="${NESTOR_SOAK_CSV:-$HOME/nestor-soak.csv}"

# Write header on first run
if [ ! -f "$CSV" ]; then
  echo "timestamp_unix,mem_used_mb,cpu_pct,db_size_bytes,server_restarts,client_restarts" > "$CSV"
fi

ts=$(date +%s)
mem=$(free -m | awk '/^Mem:/ { print $3 }')
cpu=$(top -bn1 | awk '/^%Cpu/ { print $2 }')
db_path="${NESTOR_DB_PATH:-$HOME/.nestor/nestor.db}"
db_size=$(stat -c %s "$db_path" 2>/dev/null || echo 0)
server_restarts=$(systemctl show -p NRestarts nestor-server 2>/dev/null | cut -d= -f2 || echo 0)
client_restarts=$(systemctl show -p NRestarts nestor-kiosk 2>/dev/null | cut -d= -f2 || echo 0)

echo "$ts,$mem,$cpu,$db_size,$server_restarts,$client_restarts" >> "$CSV"
