import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const ServingsScaler = (await import('../../src/food/ServingsScaler')).default;

function renderScaler(value: number, onChange = vi.fn()) {
  return render(<ServingsScaler baseServings={4} value={value} onChange={onChange} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ServingsScaler', () => {
  it('renders current value', () => {
    renderScaler(4);
    expect(screen.getByTestId('servings-value')).toHaveTextContent('4');
  });

  it('increment button calls onChange with value + 1', () => {
    const onChange = vi.fn();
    renderScaler(4, onChange);
    fireEvent.click(screen.getByLabelText('Increase servings'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('decrement button calls onChange with value - 1', () => {
    const onChange = vi.fn();
    renderScaler(4, onChange);
    fireEvent.click(screen.getByLabelText('Decrease servings'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('clamps at minimum 1 — decrement disabled at 1', () => {
    const onChange = vi.fn();
    renderScaler(1, onChange);
    const decBtn = screen.getByLabelText('Decrease servings');
    expect(decBtn).toBeDisabled();
    fireEvent.click(decBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps at maximum 99 — increment disabled at 99', () => {
    const onChange = vi.fn();
    renderScaler(99, onChange);
    const incBtn = screen.getByLabelText('Increase servings');
    expect(incBtn).toBeDisabled();
    fireEvent.click(incBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('decrement not disabled when value > 1', () => {
    renderScaler(2);
    expect(screen.getByLabelText('Decrease servings')).not.toBeDisabled();
  });

  it('increment not disabled when value < 99', () => {
    renderScaler(2);
    expect(screen.getByLabelText('Increase servings')).not.toBeDisabled();
  });

  describe('quick-set pills', () => {
    it('renders ×1, ×2, ×4 pills', () => {
      renderScaler(4);
      expect(screen.getByTestId('servings-pill-1')).toBeInTheDocument();
      expect(screen.getByTestId('servings-pill-2')).toBeInTheDocument();
      expect(screen.getByTestId('servings-pill-4')).toBeInTheDocument();
    });

    it('×1 pill calls onChange with baseServings * 1', () => {
      const onChange = vi.fn();
      renderScaler(4, onChange);
      fireEvent.click(screen.getByTestId('servings-pill-1'));
      expect(onChange).toHaveBeenCalledWith(4); // baseServings=4 * 1
    });

    it('×2 pill calls onChange with baseServings * 2', () => {
      const onChange = vi.fn();
      renderScaler(4, onChange);
      fireEvent.click(screen.getByTestId('servings-pill-2'));
      expect(onChange).toHaveBeenCalledWith(8); // baseServings=4 * 2
    });

    it('×4 pill calls onChange with baseServings * 4', () => {
      const onChange = vi.fn();
      renderScaler(4, onChange);
      fireEvent.click(screen.getByTestId('servings-pill-4'));
      expect(onChange).toHaveBeenCalledWith(16); // baseServings=4 * 4
    });

    it('active pill is highlighted when value matches baseServings * multiplier', () => {
      renderScaler(4); // value=4, base=4, so ×1 is active
      const pill1 = screen.getByTestId('servings-pill-1');
      expect(pill1).toHaveAttribute('aria-pressed', 'true');
      expect(pill1.className).toContain('bg-accent');
    });

    it('×2 pill is highlighted when value is 2x baseServings', () => {
      renderScaler(8); // value=8, base=4, so ×2 is active
      const pill2 = screen.getByTestId('servings-pill-2');
      expect(pill2).toHaveAttribute('aria-pressed', 'true');
    });

    it('no pill highlighted when value does not match any multiplier', () => {
      renderScaler(3); // value=3, base=4 - no pill matches
      expect(screen.getByTestId('servings-pill-1')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('servings-pill-2')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('servings-pill-4')).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
