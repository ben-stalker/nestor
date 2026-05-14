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
});
