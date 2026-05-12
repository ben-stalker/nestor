import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAlerts, useDismissAlert } from '../../hooks/useAlerts';
import type { Alert, AlertSeverity } from '../../api/alerts';

function SeverityIcon({ severity, className }: { severity: AlertSeverity; className?: string }) {
  if (severity === 'error') return <AlertCircle className={className} aria-hidden="true" />;
  if (severity === 'warning') return <AlertTriangle className={className} aria-hidden="true" />;
  return <Info className={className} aria-hidden="true" />;
}

function severityClass(severity: AlertSeverity): string {
  if (severity === 'error') return 'alerts-strip__item--error';
  if (severity === 'warning') return 'alerts-strip__item--warning';
  return 'alerts-strip__item--info';
}

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: number) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const content = (
    <>
      <SeverityIcon severity={alert.severity} className="alerts-strip__icon" />
      <span className="alerts-strip__message">{alert.message}</span>
    </>
  );

  return (
    <div
      className={`alerts-strip__item ${severityClass(alert.severity)}`}
      role="status"
      data-testid={`alert-item-${alert.id}`}
    >
      {alert.deep_link ? (
        <a href={alert.deep_link} className="alerts-strip__link">
          {content}
        </a>
      ) : (
        <div className="alerts-strip__content">{content}</div>
      )}
      <button
        type="button"
        className="alerts-strip__dismiss"
        aria-label={`Dismiss alert: ${alert.message}`}
        onClick={() => onDismiss(alert.id)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function AlertsStrip() {
  const { data: alerts } = useAlerts();
  const { mutate: dismiss } = useDismissAlert();

  if (!alerts || alerts.length === 0) return null;

  return (
    <section className="alerts-strip" aria-label="Alerts" data-testid="alerts-strip">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onDismiss={dismiss} />
      ))}
    </section>
  );
}
