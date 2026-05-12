import React from 'react';
import { getWidgets } from '../../core/pluginRegistry';
import ErrorBoundary from '../../components/ErrorBoundary';

interface PluginSlotProps {
  pluginId: string;
  component: React.ComponentType;
}

function PluginSlot({ pluginId, component: Widget }: PluginSlotProps) {
  return (
    <ErrorBoundary>
      <div className="plugin-widget-strip__slot" data-plugin-id={pluginId}>
        <Widget />
      </div>
    </ErrorBoundary>
  );
}

export default function PluginWidgetStrip() {
  const widgets = getWidgets();

  if (widgets.length === 0) return null;

  return (
    <section
      className="plugin-widget-strip"
      aria-label="Plugin widgets"
      data-testid="plugin-widget-strip"
    >
      {widgets.map((reg) => (
        <PluginSlot key={reg.pluginId} pluginId={reg.pluginId} component={reg.component} />
      ))}
    </section>
  );
}
