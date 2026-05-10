import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Skeleton from '../../../src/shared/ui/Skeleton';

describe('Skeleton', () => {
  it('renders a single line by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(1);
  });

  it('applies animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies motion-reduce:animate-none class for reduced-motion support', () => {
    const { container } = render(<Skeleton />);
    expect((container.firstChild as HTMLElement).className).toContain('motion-reduce:animate-none');
  });

  it('renders multiple lines when lines prop is set', () => {
    const { container } = render(<Skeleton lines={3} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('last line of multi-line skeleton is shorter', () => {
    const { container } = render(<Skeleton lines={2} />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines[1].className).toContain('w-2/3');
  });

  it('forwards className to single-line skeleton', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
