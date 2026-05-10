import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TouchTarget from '../../../src/shared/ui/TouchTarget';

describe('TouchTarget', () => {
  it('renders as button by default', () => {
    const { container } = render(<TouchTarget>Click</TouchTarget>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('applies min-h-11 and min-w-11 for 44px touch target', () => {
    const { container } = render(<TouchTarget>Click</TouchTarget>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('min-h-11');
    expect(el.className).toContain('min-w-11');
  });

  it('renders as a different element via as prop', () => {
    const { container } = render(
      <TouchTarget as="a" href="#">
        Link
      </TouchTarget>,
    );
    expect(container.querySelector('a')).toBeInTheDocument();
  });

  it('forwards extra props to the underlying element', () => {
    const { container } = render(<TouchTarget data-testid="tt">Click</TouchTarget>);
    expect(container.querySelector('[data-testid="tt"]')).toBeInTheDocument();
  });

  it('merges className', () => {
    const { container } = render(<TouchTarget className="my-class">Click</TouchTarget>);
    expect((container.firstChild as HTMLElement).className).toContain('my-class');
  });
});
