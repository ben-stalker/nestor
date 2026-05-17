import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../../src/plugins/components/RiskBadge';

describe('RiskBadge', () => {
  it('renders an Official label for official risk', () => {
    render(<RiskBadge risk="official" />);
    expect(screen.getByTestId('risk-badge-official').textContent).toBe('Official');
  });

  it('renders a Community label for community risk', () => {
    render(<RiskBadge risk="community" />);
    expect(screen.getByTestId('risk-badge-community').textContent).toBe('Community');
  });

  it('renders an Unofficial API label for unofficial risk', () => {
    render(<RiskBadge risk="unofficial" />);
    expect(screen.getByTestId('risk-badge-unofficial').textContent).toBe('Unofficial API');
  });
});
