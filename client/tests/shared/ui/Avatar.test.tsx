import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from '../../../src/shared/ui/Avatar';

describe('Avatar', () => {
  it('shows two-letter initials from full name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByLabelText('John Doe')).toHaveTextContent('JD');
  });

  it('shows single initial for one-word name', () => {
    render(<Avatar name="alice" />);
    expect(screen.getByLabelText('alice')).toHaveTextContent('A');
  });

  it('uppercases initials', () => {
    render(<Avatar name="ben smith" />);
    expect(screen.getByLabelText('ben smith')).toHaveTextContent('BS');
  });

  it('uses only first two words for initials', () => {
    render(<Avatar name="Anne Marie Jones" />);
    expect(screen.getByLabelText('Anne Marie Jones')).toHaveTextContent('AM');
  });

  it('renders image when src provided', () => {
    render(<Avatar name="Jane" src="photo.jpg" />);
    const img = screen.getByRole('img', { name: 'Jane' });
    expect(img).toHaveAttribute('src', 'photo.jpg');
  });

  it('does not render image when no src', () => {
    render(<Avatar name="Bob" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('applies colour as borderColor inline style', () => {
    const { container } = render(<Avatar name="Carol" colour="#FF6B6B" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderColor).toBeTruthy();
  });

  it('renders all sizes without error', () => {
    (['sm', 'md', 'lg'] as const).forEach((size) => {
      const { unmount } = render(<Avatar name="Test" size={size} />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
      unmount();
    });
  });
});
