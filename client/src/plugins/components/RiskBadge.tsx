import type { PluginApiRisk } from '../types';

const STYLES: Record<PluginApiRisk, { label: string; className: string }> = {
  official: { label: 'Official', className: 'bg-blue-100 text-blue-800' },
  community: { label: 'Community', className: 'bg-yellow-100 text-yellow-800' },
  unofficial: { label: 'Unofficial API', className: 'bg-orange-100 text-orange-800' },
};

export default function RiskBadge({ risk }: { risk: PluginApiRisk }) {
  const style = STYLES[risk];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${style.className}`}
      data-testid={`risk-badge-${risk}`}
    >
      {style.label}
    </span>
  );
}
